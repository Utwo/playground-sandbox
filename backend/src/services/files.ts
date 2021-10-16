import fs from "fs";
import tar from "tar";
import {
  writeFile,
  rm,
  readdir,
  readFile,
  mkdir,
  access,
  stat,
} from "fs/promises";
import path from "node:path";
import { config, GitClone } from "../config.js";
import { clone } from "./git.js";

type File = {
  name: string;
  path: string;
};

type Directory = {
  name: string;
  path: string;
  children?: Array<File | Directory>;
};

export const addFiles = async (projectName, files: Record<string, string>) => {
  return Promise.all(
    Object.entries(files).map(([path, value]) => {
      const localPath = `${config.volumeRoot}/${projectName}/${path}`;
      return writeFile(localPath, value as String);
    })
  );
};

export const deleteFiles = async (
  projectName: string,
  files: Record<string, string>
) => {
  return Promise.all(
    Object.entries(files).map(([path]) =>
      rm(`${config.volumeRoot}/${projectName}/${path}`)
    )
  );
};

export const getFileContent = async (projectName: string, filePath: string) => {
  const localPath = `${config.volumeRoot}/${projectName}/${filePath}`;
  return readFile(localPath, "utf8");
};

export const checkIfFileExist = async (
  projectName: string,
  filePath: string
) => {
  try {
    const localPath = `${config.volumeRoot}/${projectName}/${filePath}`;
    await access(localPath, fs.constants.F_OK);
    return true;
  } catch (e) {
    return false;
  }
};

export const getAllFiles = async (
  dirPath,
  objectOfFiles: Record<string, (Directory | File) & { children?: string[] }>,
  isFirstRun = true
) => {
  const filesPromise = (await readdir(dirPath)).map(async (item) => {
    const absolutePath = path.join(dirPath, "/", item);
    const isDir = (await stat(absolutePath)).isDirectory();
    return {
      name: item,
      absolutePath,
      isDir,
    };
  });

  const files = await Promise.all(filesPromise);
  files.sort((a, b) => +b.isDir - +a.isDir);

  for (const file of files) {
    if ([".next", "dist", "node_modules"].includes(file.name)) {
      continue;
    }
    const filePath = file.absolutePath.split("/").slice(4).join("/");
    objectOfFiles[filePath] = {
      name: file.name,
      path: filePath,
      //@ts-ignore
      text: file.name,
    };

    if (isFirstRun) {
      //@ts-ignore
      objectOfFiles[filePath].isRoot = true;
    }

    if (file.isDir) {
      const children = await getAllFiles(file.absolutePath, {}, false);
      objectOfFiles[filePath].children = Object.keys(children);
      objectOfFiles = { ...objectOfFiles, ...children };
    }
  }
  return objectOfFiles;
};

export const initVolume = async (
  projectName: string,
  template?: string,
  gitClone?: GitClone
) => {
  const projectPath = `${config.volumeRoot}/${projectName}`;
  const projectDir = await mkdir(projectPath, { recursive: true });

  if (!projectDir) {
    return;
  }

  // created project directory, project is new and folder is empty
  if (gitClone.url) {
    await clone(projectPath, gitClone);
    return;
  }

  console.log("Extracting archive for template");
  await tar.x({
    file: `./app-templates/${config.appTemplates[template].archive}`,
    C: projectPath,
  });
};

import { statSync } from "fs";
import tar from "tar";
import { execSync } from "child_process";
import { writeFile, rm, readdir, readFile, mkdir } from "fs/promises";
import path from "node:path";
import { config, GitClone } from "../config.js";

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

export const getAllFiles = async (
  dirPath,
  arrayOfFiles: Array<Directory | File>
) => {
  const files = (await readdir(dirPath))
    .map((item) => {
      const absolutePath = path.join(dirPath, "/", item);
      const isDir = statSync(absolutePath).isDirectory();

      return {
        name: item,
        absolutePath: absolutePath,
        isDir: isDir,
      };
    })
    .sort((a, b) => +b.isDir - +a.isDir);

  for (const file of files) {
    if ([".next", "dist", "node_modules"].includes(file.name)) {
      continue;
    }
    const filePath = file.absolutePath.split("/").slice(4).join("/");
    const fileObject = { name: file.name, path: filePath };
    if (file.isDir) {
      fileObject["children"] = await getAllFiles(file.absolutePath, []);
    }
    arrayOfFiles.push(fileObject);
  }
  return arrayOfFiles;
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
  if (gitClone) {
    execSync(`git clone -b ${gitClone.branch} ${gitClone.url}`, {
      stdio: [0, 1, 2], // we need this so node will print the command output
      cwd: projectPath,
    });
    return;
  }

  await tar.x({
    file: `./app-templates/${config.appTemplates[template].archive}`,
    C: projectPath,
  });
};

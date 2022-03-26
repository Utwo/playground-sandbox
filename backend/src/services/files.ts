import tar from "tar";
import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream";
import { promisify } from "node:util";
import {
  writeFile,
  rm,
  readdir,
  readFile,
  mkdir,
  access,
  stat,
} from "fs/promises";
import fetch from "node-fetch";
import { config, GitClone } from "../config.js";
import { URL } from "url";
import { getRepoInfo } from "./git.js";

const streamPipeline = promisify(pipeline);

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
    Object.entries(files).map(async ([filePath, value]) => {
      const localPath = `${config.volumeRoot}/${projectName}/${filePath}`;
      await mkdir(path.dirname(localPath), { recursive: true });
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
      rm(`${config.volumeRoot}/${projectName}/${path}`, { recursive: true })
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
    if ([".next", "dist", "node_modules", ".git"].includes(file.name)) {
      continue;
    }
    const sliceLength = config.volumeRoot.split("/").length + 1;
    const filePath = file.absolutePath.split("/").slice(sliceLength).join("/");
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
      const childrens = await getAllFiles(file.absolutePath, {}, false);
      objectOfFiles[filePath].children = Object.keys(childrens).filter(
        (children) => path.relative(children, filePath) === ".."
      );
      objectOfFiles = { ...objectOfFiles, ...childrens };
    }
  }

  return objectOfFiles;
};

export const initVolume = async (projectName: string, gitClone?: GitClone) => {
  const projectPath = `${config.volumeRoot}/${projectName}`;
  const projectDir = await mkdir(projectPath, { recursive: true });

  if (!projectDir) {
    return;
  }

  console.log(`Cloning repo for ${projectName}`);

  const repoUrl = new URL(`${gitClone.url}/tree/${gitClone.branch}`);
  const repoInfo = await getRepoInfo(repoUrl, gitClone.path);

  console.log(repoInfo);

  const response = await fetch(
    `https://codeload.github.com/${repoInfo.username}/${repoInfo.name}/tar.gz/${repoInfo.branch}`
  );

  if (!response.ok)
    throw new Error(`unexpected response ${response.statusText}`);

  await streamPipeline(
    response.body,
    tar.extract(
      {
        cwd: projectPath,
        strip: repoInfo.filePath ? repoInfo.filePath.split("/").length + 1 : 1,
      },
      [
        `${repoInfo.name}-${repoInfo.branch}${
          repoInfo.filePath ? `/${repoInfo.filePath}` : ""
        }`,
      ]
    )
  );
};

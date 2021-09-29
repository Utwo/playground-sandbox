import { statSync } from "fs";
import { writeFile, rm, readdir, readFile } from "fs/promises";
import path from "node:path";

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
      const localPath = `/tmp/k3dvol/${projectName}/${path}`;
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
      rm(`/tmp/k3dvol/${projectName}/${path}`)
    )
  );
};

export const getFileContent = async (projectName: string, filePath: string) => {
  const localPath = `/tmp/k3dvol/${projectName}/${filePath}`;
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

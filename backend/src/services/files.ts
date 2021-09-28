import { writeFile, rm, readdir, stat } from "fs/promises";
import path from "node:path";

type File = {
  label: string;
  path: string;
};

type Directory = {
  label: string;
  path: string;
  files?: Array<File | Directory>;
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

export const getAllFiles = async (
  dirPath,
  arrayOfFiles: Array<Directory | File>
) => {
  const files = await readdir(dirPath);

  arrayOfFiles = arrayOfFiles || [{ label: ".", path: "." }];

  for (const file of files) {
    const absolutePath = path.join(dirPath, "/", file);
    if ((await stat(absolutePath)).isDirectory()) {
      //@ts-ignore
      arrayOfFiles.files = await getAllFiles(absolutePath, arrayOfFiles);
    } else {
      arrayOfFiles.push({ label: file, path: absolutePath });
    }
  }
  console.log(arrayOfFiles);
  return arrayOfFiles;
};

import { writeFile, rm } from "fs/promises";

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

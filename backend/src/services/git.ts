import { execFile } from "node:child_process";
import { pipeline } from "node:stream";
import { URL } from "node:url";
import util from "node:util";
import { promisify } from "node:util";
import { extract } from "tar";
import type { GitClone } from "../config.ts";

export type RepoInfo = {
  username: string;
  name: string;
  branch: string;
  filePath: string;
};

const streamPipeline = promisify(pipeline);

export const cloneFromGitlab = async (
  projectPath: string,
  gitOptions: GitClone,
) => {
  const execFilePromise = util.promisify(execFile);
  console.log(`Cloning repository ${gitOptions.url}`);
  // TODO: If the shell option is enabled, do not pass unsanitized user input to this function.
  // Any input containing shell metacharacters may be used to trigger arbitrary command execution
  const { stderr } = await execFilePromise("git", [
    "clone",
    "-b",
    gitOptions.branch,
    gitOptions.url,
    projectPath,
  ]);
  if (stderr) {
    console.error(stderr);
  }
};

export const cloneFromGithub = async (
  projectPath: string,
  gitOptions: GitClone,
) => {
  const repoUrl = new URL(`${gitOptions.url}/tree/${gitOptions.branch}`);
  const repoInfo = getRepoInfo(repoUrl, gitOptions.path);

  const response = await fetch(
    `https://codeload.github.com/${repoInfo.username}/${repoInfo.name}/tar.gz/${repoInfo.branch}`,
  );

  if (!response.ok) {
    throw new Error(`unexpected response ${response.statusText}`);
  }

  await streamPipeline(
    response.body,
    extract(
      {
        cwd: projectPath,
        strip: repoInfo.filePath ? repoInfo.filePath.split("/").length + 1 : 1,
      },
      [
        `${repoInfo.name}-${repoInfo.branch}${
          repoInfo.filePath ? `/${repoInfo.filePath}` : ""
        }`,
      ],
    ),
  );
};

export function getRepoInfo(
  url: URL,
  examplePath?: string,
): RepoInfo | undefined {
  const [, username, name, _t, _branch, ...file] = url.pathname.split("/");
  const filePath = examplePath
    ? examplePath.replace(/^\//, "")
    : file.join("/");

  // If examplePath is available, the branch name takes the entire path
  const branch = examplePath
    ? `${_branch}/${file.join("/")}`.replace(new RegExp(`/${filePath}|/$`), "")
    : _branch;

  return { username, name, branch, filePath };
}

import util from "util";
import { execFile } from "child_process";
import { GitClone } from "../config";
import { URL } from "url";

export type RepoInfo = {
  username: string;
  name: string;
  branch: string;
  filePath: string;
};

export const clone = async (projectPath: string, gitOptions: GitClone) => {
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

export async function getRepoInfo(
  url: URL,
  examplePath?: string
): Promise<RepoInfo | undefined> {
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

import util from "util";
import { execFile } from "child_process";
import { GitClone } from "../config";

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

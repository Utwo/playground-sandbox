import type { Context } from "hono";
import { getFileContent } from "../services/files.ts";

export const getFileContentReq = async (c: Context) => {
  const { projectName, filePath } = await c.req.json();

  try {
    const content = await getFileContent(projectName, filePath);
    return c.html(content);
  } catch (err) {
    console.error(err);
    return c.json({ error: "Something went wrong" }, 500);
  }
};

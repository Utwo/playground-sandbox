import { getFileContent } from "../services/files.js";

export const getFileContentReq = async (req, res) => {
  const { projectName, filePath } = req.body;

  try {
    const content = await getFileContent(projectName, filePath);
    res.set("Content-Type", "text/html");
    return res.send(content);
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: "Something went wrong" });
  }
};

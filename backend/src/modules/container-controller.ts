import {
  createSandbox,
  sendLogsFromSandbox,
  stopSandbox,
} from "../services/k8s.js";
import { addFiles, deleteFiles, getFileContent } from "../services/files.js";

export const createSandboxReq = async (req, res) => {
  try {
    const { projectName, template } = req.body;
    const { pod, service } = await createSandbox(projectName, template);
    sendLogsFromSandbox(
      projectName,
      req.app.locals.io,
      projectName,
      true
    ).catch(console.error);
    return res.send({ pod: pod.body, service: service.body });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: "Something went wrong" });
  }
};

export const stopSandboxReq = async (req, res) => {
  const { projectName, deleteFiles } = req.body;

  try {
    await stopSandbox(projectName, deleteFiles);
    return res.send("ok");
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: "Something went wrong" });
  }
};
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

export const addFilesReq = async (req, res) => {
  try {
    const { projectName, files } = req.body;
    await addFiles(projectName, files);
    return res.send("ok");
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: "Something went wrong" });
  }
};

export const deleteFilesReq = async (req, res) => {
  try {
    const { projectName, files } = req.body;
    await deleteFiles(projectName, files);
    return res.send("ok");
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: "Something went wrong" });
  }
};

// export const addFilesOld = async (req, res) => {
//   // await Promise.all(
//   try {
//     const { projectName, files } = req.body;
//     for (const [, value] of Object.entries(files)) {
//       const localPath = `/tmp/next-app-${crypto.randomUUID()}`;
//       await writeFile(localPath, value as String);
//       const command = ["tee", "/app/pages/home.js"];

//       const readStream = fs.createReadStream(localPath);
//       const errStream = new stream_buffers.WritableStreamBuffer();
//       exec.exec(
//         "public",
//         projectName,
//         "next-app",
//         command,
//         null,
//         errStream,
//         readStream,
//         false,
//         async () => {
//           if (errStream.size()) {
//             throw new Error(
//               `Error from cpToPod - details: \n ${errStream.getContentsAsString()}`
//             );
//           }
//         }
//       );
//     }
//     return res.send("ok");
//   } catch (err) {
//     return res.send({ error: err.message });
//   }
// };

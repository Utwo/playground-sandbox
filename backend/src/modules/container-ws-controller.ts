import stream from "stream";
import { config } from "../config.js";
import { getAllFiles } from "../services/files.js";
import {
  createSandbox,
  getPodStatus,
  k8sAttach,
  sendLogsFromSandbox,
} from "../services/k8s.js";

export default function (io) {
  const socketConnected = async function (socket) {
    console.info("New client connected");
    const { projectName, template } = socket.handshake.query;
    socket.data.projectName = projectName;
    socket.join(projectName);
    init(projectName, template, socket);
  };

  const init = async (projectName, template, socket) => {
    try {
      await getPodStatus(projectName);
      sendLogsFromSandbox(projectName as string, io, socket.id, false).catch(
        console.error
      );
      sendFilesFromSandboxWs(socket).catch(console.error);
    } catch (e) {
      if (e.statusCode === 404) {
        await createSandbox(projectName as string, template as string);
        console.info("container created");
        setTimeout(init, 5000, projectName, template, socket);
      }
    }
  };

  const sendFilesFromSandboxWs = async function (socket) {
    const projectName = socket.data.projectName;
    const allFiles = await getAllFiles(
      `${config.volumeRoot}/${projectName}`,
      []
    );
    socket.emit("sandbox:files:tree", allFiles);
  };

  const startNewTerminalCommandWs = function (req) {
    const { projectName } = req;
    const socket = this;
    const readLogStream = new stream.Readable({
      read() {},
    });
    const writeLogStream = new stream.Writable();
    socket.data.readLogStream = readLogStream;

    writeLogStream.on("data", (chunk) =>
      socket.emit("terminal:data", chunk.toString())
    );
    writeLogStream.on("error", (chunk) =>
      socket.emit("terminal:error", chunk.toString())
    );
    writeLogStream.on("end", () => {
      console.info("End log stream");
    });

    k8sAttach.attach(
      config.sandboxNamespace,
      projectName,
      config.sandboxContainerName,
      writeLogStream,
      writeLogStream,
      readLogStream,
      false
    );
  };

  const execCommandWs = function (req) {
    const { command } = req;
    const socket = this;
    const readLogStream = socket.data.readLogStream as stream.Readable;
    readLogStream.push(command);
  };

  const socketDisconnectWs = function () {
    console.log("disconnect");
  };

  return {
    socketConnected,
    sendFilesFromSandboxWs,
    startNewTerminalCommandWs,
    execCommandWs,
    socketDisconnectWs,
  };
}

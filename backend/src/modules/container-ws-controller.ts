import stream from "stream";
import { config } from "../config.js";
import { getAllFiles } from "../services/files.js";
import { k8sAttach, k8sLog } from "../services/k8s.js";

export default function (io) {
  const sendFilesFromSandbox = async function (socket) {
    const projectName = socket.data.projectName;
    const allFiles = await getAllFiles(`/tmp/k3dvol/${projectName}`, []);
    io.to(projectName).emit("sandbox:files:tree", allFiles);
  };

  const sendLogsFromSandbox = function (socket) {
    const projectName = socket.data.projectName;

    const logStream = new stream.PassThrough();
    logStream.setEncoding("utf-8");
    logStream.on("data", (chunk) =>
      io.to(projectName).emit("sandbox:log:data", chunk)
    );
    logStream.on("error", (chunk) => console.error(chunk));

    k8sLog
      .log(
        config.sandboxNamespace,
        projectName,
        config.sandboxContainerName,
        logStream,
        {
          follow: true,
          tailLines: 50,
          pretty: false,
          timestamps: false,
        }
      )
      .catch((err) => {
        console.error(err);
      })
      .then((req) => {
        socket.data.k8sLogReq = req;
      });
  };

  const startNewTerminalCommand = function (req) {
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

  const execCommand = function (req) {
    const { command } = req;
    const socket = this;
    const readLogStream = socket.data.readLogStream as stream.Readable;
    readLogStream.push(command);
  };

  const socketDisconnect = function () {
    const socket = this;
    if (socket.data.k8sLogReq) {
      socket.data.k8sLogReq.abort();
    }

    console.log("disconnect");
  };

  return {
    sendFilesFromSandbox,
    sendLogsFromSandbox,
    startNewTerminalCommand,
    execCommand,
    socketDisconnect,
  };
}

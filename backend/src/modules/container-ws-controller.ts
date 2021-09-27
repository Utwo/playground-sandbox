import stream from "stream";
import { config } from "../config.js";
import { k8sAttach, k8sLog } from "../services/k8s.js";

export default function (io) {
  const logsFromSandbox = function (req) {
    const { projectName } = req;
    const socket = this;
    const logStream = new stream.PassThrough();
    logStream.setEncoding("utf-8");
    logStream.on("data", (chunk) => socket.emit("log:data", chunk));
    logStream.on("error", (chunk) => socket.emit("log:error", chunk));

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

  const startCommand = function (req) {
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
    logsFromSandbox,
    startCommand,
    execCommand,
    socketDisconnect,
  };
}

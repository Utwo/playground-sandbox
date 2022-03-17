import stream from "stream";
import { config, ContainerConfig, GitClone } from "../config.js";
import {
  addFiles,
  checkIfFileExist,
  deleteFiles,
  getAllFiles,
  initVolume,
} from "../services/files.js";
import {
  createSandbox,
  getPodStatus,
  k8sAttach,
  sendLogsFromSandbox,
} from "../services/k8s.js";

export default function (io) {
  const socketConnected = async function (socket) {
    console.info("New client connected");
    const {
      projectName,
      gitUrl,
      gitBranch,
      gitPath,
      command,
      image,
      args,
      port,
      env,
    } = socket.handshake.query;
    socket.data.projectName = projectName;
    socket.join(projectName);
    const gitClone: GitClone = {
      url: gitUrl,
      branch: gitBranch,
      path: gitPath,
    };

    let containerOptions: ContainerConfig = {
      command,
      image,
      args,
      port: +port,
      env,
    };
    init(projectName, socket, containerOptions, true, gitClone);
  };

  const init = async (
    projectName: string,
    socket,
    containerOptions: ContainerConfig,
    firstTry: boolean,
    gitClone?: GitClone
  ) => {
    try {
      await getPodStatus(projectName);
      sendFilesFromSandboxWs(socket).catch((error) =>
        console.error(error.message)
      );
      sendLogsFromSandbox(projectName as string, io, socket.id, false).catch(
        (error) => console.error(error.message)
      );
    } catch (e) {
      if (e.statusCode !== 404 || !firstTry) {
        console.error(e.message);
        return;
      }

      // pod not found, lets create a new one
      await initVolume(projectName, gitClone);
      const isPackageLock = await checkIfFileExist(
        projectName,
        "package-lock.json"
      );
      containerOptions.command = isPackageLock
        ? ["sh", "-c", `npm ci && ${containerOptions.command}`]
        : ["sh", "-c", `yarn && ${containerOptions.command}`];
      try {
        await createSandbox(projectName, containerOptions);
      } catch (e) {
        console.error(e.message);
      }
      console.info("Container created");
      setTimeout(
        init,
        5000,
        projectName,
        socket,
        containerOptions,
        false,
        gitClone
      );
    }
  };

  const sendFilesFromSandboxWs = async function (socket) {
    const { projectName } = socket.data;
    const allFiles = await getAllFiles(
      `${config.volumeRoot}/${projectName}`,
      {}
    );
    socket.emit("sandbox:files:tree", allFiles);
  };

  const startNewTerminalCommandWs = async function (req) {
    const socket = this;
    const { projectName } = socket.data;

    // const writeLogStream = new stream.Writable();
    // readLogStream.on("data", (chunk) => {
    //   console.log("yyyyayyyy");
    //   socket.emit("terminal:data", chunk.toString());
    // });
    // writeLogStream.on("data", (chunk) => {
    //   console.log("yyyyayyyy");
    //   socket.emit("terminal:data", chunk.toString());
    // });
    // writeLogStream.on("error", (chunk) => {
    //   console.error("ooooooops");
    //   socket.emit("terminal:error", chunk.toString());
    // });
    // writeLogStream.on("end", () => {
    //   console.info("End log stream");
    // });

    const readLogStream = new stream.Readable({
      read(size) {
        return;
      },
    });

    socket.emit("sandbox:attach:data", "test");
    socket.on("sandbox:attach:data", async (command) => {
      console.log("command", command);
      readLogStream.push("ls -a");
    });

    const logStream = new stream.PassThrough();
    logStream.setEncoding("utf-8");
    logStream.on("data", (chunk) => {
      console.log("merge", chunk);
    });
    logStream.on("error", (chunk) => console.error(chunk));

    const sock = await k8sAttach.attach(
      config.sandboxNamespace,
      projectName,
      config.sandboxContainerName,
      logStream,
      logStream,
      readLogStream,
      false
    );

    sock.emit("message", "ls -a");
    sock.emit("data", "ls -a");
    sock.on("onMessage", (chunk) => {
      console.log("merge1", chunk);
    });
    sock.on("onError", (chunk) => {
      console.log("merge2", chunk);
    });
    sock.on("onOpen", (chunk) => {
      console.log("merge3", chunk);
    });
    console.log(123);
    readLogStream.push("ls -a");
  };

  const execCommandWs = function (req) {
    const { command } = req;
    const socket = this;
    const readLogStream = socket.data.readLogStream as stream.Readable;
    readLogStream.push(command);
  };

  const addFilesWs = async function (req) {
    try {
      const socket = this;
      const { files } = req;
      const { projectName } = socket.data;
      await addFiles(projectName, files);
      socket.to(projectName).emit("files:add", files);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteFilesWs = async function (req) {
    try {
      const socket = this;
      const { files } = req;
      const { projectName } = socket.data;

      await deleteFiles(projectName, files);
      socket.to(projectName).emit("files:deleted", { files });
    } catch (err) {
      console.error(err);
    }
  };

  const socketDisconnectWs = function () {
    console.log("disconnect");
  };

  return {
    socketConnected,
    startNewTerminalCommandWs,
    execCommandWs,
    addFilesWs,
    deleteFilesWs,
    socketDisconnectWs,
  };
}

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
      sendFilesFromSandboxWs(socket).catch(console.error);
      sendLogsFromSandbox(projectName as string, io, socket.id, false).catch(
        console.error
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
        console.log(e.message);
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

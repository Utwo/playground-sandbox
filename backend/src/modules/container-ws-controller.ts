import stream from "stream";
import { config, type ContainerConfig, type GitClone } from "../config.ts";
import {
  addFiles,
  checkIfFileExist,
  deleteFiles,
  getAllFiles,
  initVolume,
} from "../services/files.ts";
import {
  createSandbox,
  getPodStatus,
  k8sExec,
  sendLogsFromSandbox,
} from "../services/k8s.ts";

export default function (io) {
  const socketConnected = function (socket) {
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

    const containerOptions: ContainerConfig = {
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
    gitClone?: GitClone,
  ) => {
    try {
      await getPodStatus(projectName);

      sendFilesFromSandboxWs(socket).catch((error) =>
        console.error(error.message)
      );

      sendLogsFromSandbox(projectName as string, io, true).catch((error) =>
        console.error(error.message)
      );
    } catch (e) {
      if (e.code !== 404 || !firstTry) {
        console.error(e.message);
        return;
      }

      // pod not found, lets create a new one
      await initVolume(projectName, gitClone);
      const isPackageLock = await checkIfFileExist(
        projectName,
        "package-lock.json",
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
        gitClone,
      );
    }
  };

  const sendFilesFromSandboxWs = async function (socket) {
    const { projectName } = socket.data;
    const allFiles = await getAllFiles(
      `${config.volumeRoot}/${projectName}`,
      {},
    );
    socket.emit("sandbox:files:tree", allFiles);
  };

  const startNewTerminalWs = async function (socket) {
    const projectName = socket.nsp.name.split("/")[1];

    const writeLogStream = new stream.Writable({
      write(chunk, _encoding, next) {
        socket.emit("sandbox:exec", chunk.toString());
        next();
      },
    });

    const readLogStream = new stream.Readable({
      read(_size) {},
    });

    socket.data.readLogStream = readLogStream;
    socket.on("sandbox:exec", (command) => {
      readLogStream.push(command);
    });

    try {
      await k8sExec.exec(
        config.sandboxNamespace,
        projectName,
        config.sandboxContainerName,
        ["bash"],
        writeLogStream,
        writeLogStream,
        readLogStream,
        true,
        (status) => {
          socket.disconnect();
          if (status.status === "Success") {
            return;
          }
          console.error(JSON.stringify(status, null, 2));
        },
      );
    } catch (err) {
      console.error(err);
      socket.disconnect();
    }
  };

  const addFilesWs = async function (req) {
    try {
      // deno-lint-ignore no-this-alias
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
      // deno-lint-ignore no-this-alias
      const socket = this;
      const { files } = req;
      const { projectName } = socket.data;

      await deleteFiles(projectName, files);
      socket.to(projectName).emit("files:deleted", { files });
    } catch (err) {
      console.error(err);
    }
  };

  const socketDisconnectWs = () => {
    console.log("disconnect");
  };

  const socketDisconnectTerminalWs = function () {
    // deno-lint-ignore no-this-alias
    const socket = this;
    console.log("close terminal");
    const readLogStream = socket.data.readLogStream;
    readLogStream.push("exit\n");
  };

  return {
    socketConnected,
    startNewTerminalWs,
    addFilesWs,
    deleteFilesWs,
    socketDisconnectWs,
    socketDisconnectTerminalWs,
  };
}

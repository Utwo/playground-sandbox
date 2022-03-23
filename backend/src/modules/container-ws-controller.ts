import stream from "stream";
import WebSocket from "isomorphic-ws";
import fs from "fs";
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
  k8sApi,
  k8sExec,
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

  const startNewTerminalCommandWs1 = async function (podName) {
    const k8sApiResp = await k8sApi.getAPIResources();
    console.log(process.env.KUBERNETES_SERVICE_HOST);
    // console.log(JSON.stringify(k8sApi, null, 2));
    // console.log(JSON.stringify(k8sAttach, null, 2));
    const podUrl = `wss://10.43.0.1/api/v1/namespaces/${config.sandboxNamespace}/pods/${podName}/exec?command=echo&command=foo&stderr=true&stdout=true`;
    return new WebSocket(
      podUrl,
      [
        "v4.channel.k8s.io",
        "v3.channel.k8s.io",
        "v2.channel.k8s.io",
        "channel.k8s.io",
      ],
      {
        ca: fs.readFileSync(
          "/var/run/secrets/kubernetes.io/serviceaccount/ca.crt"
        ),
        cert: fs.readFileSync(
          "/var/run/secrets/kubernetes.io/serviceaccount/ca.crt"
        ),
        key: fs.readFileSync(
          "/var/run/secrets/kubernetes.io/serviceaccount/token"
        ),
        headers: {
          // @ts-ignore
          Authorization: k8sApiResp.response.request.headers["Authorization"],
        },
      }
    );
  };

  const startNewTerminalCommandWs = async function (req) {
    const socket = this;
    const { projectName } = socket.data;

    const writeLogStream = new stream.Writable({
      write(chunk, encoding, next) {
        console.log(chunk.toString());
        socket.emit("sandbox:attach:data", chunk.toString());
        next();
      },
    });

    writeLogStream.on("data", (chunk) => {
      console.log("writeLogStream");
      socket.emit("terminal:data", chunk.toString());
    });
    writeLogStream.on("error", (chunk) => {
      console.error("ooooooops");
      socket.emit("terminal:error", chunk.toString());
    });
    writeLogStream.on("end", () => {
      console.info("End log stream");
    });

    const readLogStream = new stream.Readable({
      read(size) {
        // console.log("read");
      },
    });

    socket.on("sandbox:attach:data", async (command) => {
      console.log("command", command);
      readLogStream.push(command);
    });

    // const osStream = new WritableStreamBuffer();
    // const errStream = new WritableStreamBuffer();
    // const isStream = new ReadableStreamBuffer();
    // const logStream = new stream.PassThrough();

    k8sExec
      .exec(
        config.sandboxNamespace,
        projectName,
        config.sandboxContainerName,
        ["bash"],
        writeLogStream,
        writeLogStream,
        // process.stdin as stream.Readable,
        readLogStream,
        true /* tty */,
        (status) => {
          // tslint:disable-next-line:no-console
          console.log("Exited with status:");
          // tslint:disable-next-line:no-console
          console.log(JSON.stringify(status, null, 2));
        }
      )
      .then((sock) => {
        console.log("then");
        // sock.on("message", (data: Buffer) => {
        //   console.log("message 1234", data.toString("utf8"));
        // });
        // readLogStream.push("ls -a \n");
        // readLogStream.push("touch /opt/test.txt\n");
      })
      .catch((err) => {
        console.log(err);
      });
    readLogStream.push("ls -a \n");
    //@ts-ignore
    // let buff = logStream.getContents() as Buffer;
    // for (let i = 0; i < 1024; i++) {
    //   expect(buff[i]).to.equal(10);
    // }

    // sock.send("ls -a", (err) => {
    //   if (err) {
    //     console.error(err);
    //   }
    // });

    // sock.on("open", (data) => {
    //   console.log("open");
    //   sock.on("message", (data) => {
    //     console.log("message", data);
    //     socket.emit(data.toString());
    //   });

    //   socket.on("exec", (message) => {
    //     console.log("send message", message);
    //     sock.send(stdin(message));
    //   });
    // });

    // sock.on("message", (data: Buffer) => {
    //   console.log("message 1234", data.toString("utf8"));
    //   socket.emit(data.toString("utf8"));
    // });

    // sock.on("error", (error) => {
    //   console.log(error);
    //   socket.emit(error.toString());
    // });

    // sock.on("close", () => {
    //   console.log("[!]123 k8s socket closed");
    //   socket.disconnect();
    // });

    // socket.on("disconnect", () => {
    //   const closeShell = () => {
    //     const state = sock.readyState;
    //     if (state === 0) {
    //       return setTimeout(closeShell, 1000);
    //     }
    //     if (state === 2 || state === 3) {
    //       return;
    //     }
    //     // Exists current shell to prevent zombie processes
    //     sock.send(stdin("exit\n"));
    //     sock.close();
    //   };

    //   closeShell();
    //   console.log("[!]123 client connection closed");
    // });

    // sock.addEventListener("message", function (event) {
    //   console.log("123456 Message from server ", event.data.toString());
    // });
    // sock.send("ls -a");
    // sock.send("ls -a");

    // console.log(123);
    // readLogStream.push("ls -a");
    // readLogStream.push(null);
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
    startNewTerminalCommandWs1,
    execCommandWs,
    addFilesWs,
    deleteFilesWs,
    socketDisconnectWs,
  };
}

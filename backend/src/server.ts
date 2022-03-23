import cors from "cors";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { config } from "./config.js";
import { getFileContentReq } from "./modules/container-controller.js";
import wsController from "./modules/container-ws-controller.js";
import {
  getAllPods,
  initInformer,
  sendLogsFromSandbox,
  stopSandbox,
} from "./services/k8s.js";
import { getActiveRooms } from "./utils.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { transports: ["websocket"] });
app.locals.io = io;

app.use(cors());
app.use(express.json());

initInformer(io);

const pods = await getAllPods();
pods.forEach((pod) =>
  sendLogsFromSandbox(pod.metadata.name, io, pod.metadata.name, true).catch(
    console.error
  )
);

const {
  socketConnected,
  startNewTerminalCommandWs,
  execCommandWs,
  socketDisconnectWs,
  addFilesWs,
  deleteFilesWs,
} = wsController(io);

io.on("connection", async (socket) => {
  await socketConnected(socket);
  socket.on("sandbox:terminal:start", startNewTerminalCommandWs);
  socket.on("sandbox:terminal:exec", execCommandWs);
  socket.on("files:add", addFilesWs);
  socket.on("files:delete", deleteFilesWs);
  socket.on("disconnect", socketDisconnectWs);
});

// io.of((name, auth, next) => {
//   console.log("name", name);
//   next(null, true); // or false, when the creation is denied
// }).on("connection", async (socket) => {
//   const podName = socket.nsp.name.split("/")[1];
//   console.log("connected to", podName);

//   const podSocket = await startNewTerminalCommandWs1(podName);
//   podSocket.on("upgrade", (x) => console.log("upgrade", x.headers.upgrade));
//   podSocket.on("open", (data) => {
//     console.log("open");
//     podSocket.on("message", (data) => {
//       console.log("message", data);
//       socket.emit(data.toString());
//     });

//     socket.on("exec", (message) => {
//       console.log("send message", message);
//       podSocket.send(stdin(message));
//     });
//   });
//   podSocket.on("error", (error) => {
//     console.log(error);
//     socket.emit(error.toString());
//   });

//   podSocket.on("close", () => {
//     console.log("[!] k8s socket closed");
//     // socket.disconnect();
//   });

//   socket.on("disconnect", () => {
//     const closeShell = () => {
//       const state = podSocket.readyState;
//       if (state === 0) {
//         return setTimeout(closeShell, 1000);
//       }
//       if (state === 2 || state === 3) {
//         return;
//       }
//       // Exists current shell to prevent zombie processes
//       podSocket.send(stdin("exit\n"));
//       podSocket.close();
//     };

//     closeShell();
//     console.log("[!] client connection closed");
//   });
// });

app.post("/get-file-content", getFileContentReq);
app.get("/", (req, res) => res.send("ok"));

// delete pods that are not in active rooms
setInterval(async () => {
  const pods = await getAllPods();
  const activeRooms = getActiveRooms(io);
  pods
    .map((pod) => pod.metadata.name)
    .filter((podName) => !activeRooms.includes(podName))
    .forEach((podName) => {
      stopSandbox(podName, true)
        .then(() => {
          console.info(`Pod ${podName} was deleted`);
        })
        .catch((err) => {
          console.error(err);
        });
    });
}, config.removeInactiveSandboxAfter);

server.listen(config.port, () => {
  console.info(`> Ready on http://localhost:${config.port}`);
});

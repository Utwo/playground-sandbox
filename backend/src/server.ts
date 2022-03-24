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
  socketDisconnectWs,
  addFilesWs,
  deleteFilesWs,
  socketDisconnectTerminalWs,
  startNewTerminalWs,
} = wsController(io);

io.on("connection", async (socket) => {
  await socketConnected(socket);
  socket.on("files:add", addFilesWs);
  socket.on("files:delete", deleteFilesWs);
  socket.on("disconnect", socketDisconnectWs);
});

// new terminal created
io.of((name, auth, next) => {
  next(null, true);
}).on("connection", async (socket) => {
  await startNewTerminalWs(socket);
  socket.on("disconnect", socketDisconnectTerminalWs);
});

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

import cors from "cors";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { config } from "./config.js";
import {
  createSandboxReq,
  stopSandboxReq,
  addFilesReq,
  deleteFilesReq,
} from "./modules/container-controller.js";
import wsController from "./modules/container-ws-controller.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { transports: ["websocket"] });
app.use(cors());
app.use(express.json());

const {
  sendLogsFromSandbox,
  sendFilesFromSandbox,
  startNewTerminalCommand,
  execCommand,
  socketDisconnect,
} = wsController(io);

// get all pods from public namespace
// call sendLogsFromSandbox for each pod

io.on("connection", (socket) => {
  console.info("New client connected");
  const projectName = socket.handshake.query.projectName;

  socket.data.projectName = projectName;
  socket.join(projectName);
  sendLogsFromSandbox(socket);
  sendFilesFromSandbox(socket);

  socket.on("sandbox:terminal:start", startNewTerminalCommand);
  socket.on("sandbox:terminal:exec", execCommand);
  socket.on("disconnect", socketDisconnect);
});

app.post("/create-sandbox", createSandboxReq);
app.delete("/stop-sandbox", stopSandboxReq);
app.post("/add-files", addFilesReq);
app.delete("/delete-files", deleteFilesReq);
app.get("/", (req, res) => res.send("ok"));

server.listen(config.port, () => {
  console.info(`> Ready on http://localhost:${config.port}`);
});

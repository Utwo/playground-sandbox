import process from "node:process";
import { serve } from "@hono/node-server";
import { type Context, Hono } from "hono";
import { cors } from "hono/cors";
import { Server as HttpServer } from "node:http";
import { Server as IOServer } from "socket.io";
import { config } from "./config.ts";
import { getFileContentReq } from "./modules/container-controller.ts";
import wsController from "./modules/container-ws-controller.ts";
import { getAllPods, initInformer, stopSandbox } from "./services/k8s.ts";
import { getActiveRooms } from "./utils.ts";

const app = new Hono();
const server = serve(
  {
    fetch: app.fetch,
    port: config.port,
  },
  (info) => {
    console.log(`> Ready on http://${info.address}:${info.port}`);
  }
);
const io = new IOServer(server as HttpServer, { transports: ["websocket"] });

app.use(cors());
app.use(async (c: Context, next) => {
  c.set("io", io);
  await next();
});

initInformer(io);

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
io.of((_name, _auth, next) => {
  next(null, true);
}).on("connection", async (socket) => {
  await startNewTerminalWs(socket);
  socket.on("disconnect", socketDisconnectTerminalWs);
});

app.post("/get-file-content", getFileContentReq);
app.get("/", ({ text }) => text("ok"));

// delete pods that are not in active rooms
setInterval(async () => {
  const pods = await getAllPods();
  const activeRooms = getActiveRooms(io);
  pods.items
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

// quit properly on docker stop
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown() {
  server.close((err) => {
    if (err) {
      console.error(err);
      process.exitCode = 1;
    }
    process.exit();
  });

  setTimeout(() => {
    console.error(
      "Could not close connections in time, forcefully shutting down"
    );
    process.exit(1);
  }, 10000);

  io.disconnectSockets();
}

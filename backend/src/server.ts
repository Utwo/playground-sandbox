import { rmSync } from "node:fs";
import { readdir } from "node:fs/promises";
import type { Server as HttpServer } from "node:http";
import process from "node:process";
import { serve } from "@hono/node-server";
import { metrics } from "@opentelemetry/api";
import { type Context, Hono } from "hono";
import { cors } from "hono/cors";
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
    console.log(`> Ready on http://localhost:${info.port}`);
  },
);
const io = new IOServer(server as HttpServer, { transports: ["websocket"] });

app.use(cors());
app.use(async (c: Context, next) => {
  c.set("io", io);
  await next();
});

const meter = metrics.getMeter("sandbox-backend");
const counter = meter.createUpDownCounter("events.running-pods");

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
const cleanupInterval = setInterval(async () => {
  const pods = await getAllPods();
  const activeRooms = getActiveRooms(io);
  for (const pod of pods?.items ?? []) {
    const podName = pod.metadata.name;
    if (!activeRooms.includes(podName)) {
      try {
        await stopSandbox(podName, false);
        console.info(`Pod ${podName} was deleted`);
        counter.add(-1);
      } catch (err) {
        console.error(err);
      }
    }
  }

  try {
    const folders = await readdir(config.volumeRoot, { withFileTypes: true });
    for (const folder of folders) {
      if (
        !pods?.items.some((pod) => pod.metadata.name === folder.name) &&
        folder.isDirectory()
      ) {
        try {
          await rmSync(`${config.volumeRoot}/${folder.name}`, {
            recursive: true,
            force: true,
          });
          console.info(`Orphaned folder ${folder.name} was deleted`);
        } catch (err) {
          console.error(err);
        }
      }
    }
  } catch (err) {
    console.error(err);
  }
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
      "Could not close connections in time, forcefully shutting down",
    );
    process.exit(1);
  }, 10000);
  clearInterval(cleanupInterval);
  io.disconnectSockets();
}

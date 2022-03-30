import k8s from "@kubernetes/client-node";
import { rm } from "fs/promises";
import stream from "stream";
import { ContainerConfig, config } from "../config.js";

const kc = new k8s.KubeConfig();
kc.loadFromDefault();
export const k8sExec = new k8s.Exec(kc);
export const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sLog = new k8s.Log(kc);

export const initInformer = (io) => {
  const listFn = () => k8sApi.listNamespacedEvent(config.sandboxNamespace);

  const informer = k8s.makeInformer(
    kc,
    `/api/v1/namespaces/${config.sandboxNamespace}/pods`,
    listFn
  );

  informer.on("add", (obj: k8s.V1Pod) => {
    io.to(obj.metadata.name).emit("sandbox:event", obj.status?.phase);
  });

  informer.on("update", (obj: k8s.V1Pod) => {
    io.to(obj.metadata.name).emit("sandbox:event", obj.status?.phase);
  });

  informer.on("error", (err: k8s.CoreV1Event) => {
    console.error(err);
    // Restart informer after 5sec
    setTimeout(() => {
      informer.start();
    }, 5000);
  });

  informer.start();
};

export const getPodStatus = async (projectName) => {
  const resp = await k8sApi.readNamespacedPodStatus(
    projectName,
    config.sandboxNamespace
  );
  return resp.body;
};

export const sendLogsFromSandbox = async (
  projectName: string,
  io,
  follow: boolean
) => {
  const logStream = new stream.PassThrough();
  logStream.setEncoding("utf-8");
  logStream.on("data", (chunk) => {
    io.to(projectName).emit("sandbox:log:data", chunk);
  });
  logStream.on("error", (chunk) => console.error(chunk));

  return k8sLog.log(
    config.sandboxNamespace,
    projectName,
    config.sandboxContainerName,
    logStream,
    {
      follow,
      tailLines: 50,
      pretty: false,
      timestamps: false,
    }
  );
};

export const createSandbox = async (
  projectName: string,
  containerOptions: ContainerConfig
) => {
  const [pod, service] = await Promise.all([
    k8sApi.createNamespacedPod(config.sandboxNamespace, {
      kind: "Pod",
      metadata: {
        name: projectName,
        labels: {
          app: projectName,
        },
      },
      spec: {
        volumes: [
          {
            name: "project-pv-storage",
            persistentVolumeClaim: {
              claimName: "projects-pv-claim-public",
            },
          },
        ],
        containers: [
          {
            name: config.sandboxContainerName,
            image: containerOptions.image,
            workingDir: "/app",
            command: containerOptions.command,
            args: containerOptions.args,
            env: containerOptions.env,
            volumeMounts: [
              {
                name: "project-pv-storage",
                mountPath: "/app",
                subPath: projectName,
              },
            ],
            ports: [
              {
                name: "sandbox-port",
                containerPort: containerOptions.port,
              },
            ],
          },
          {
            name: config.vscodeContainerName,
            image: "gitpod/openvscode-server:latest",
            args: ["--port", "$(PORT)"],
            env: [
              {
                name: "PORT",
                value: config.vscodeContainerPort.toString(),
              },
            ],
            securityContext: {
              runAsUser: 0,
            },
            volumeMounts: [
              {
                name: "project-pv-storage",
                mountPath: "/home/workspace",
                subPath: projectName,
              },
            ],
            ports: [
              {
                name: "vscode-port",
                containerPort: config.vscodeContainerPort,
              },
            ],
          },
        ],
      },
    }),
    k8sApi.createNamespacedService(config.sandboxNamespace, {
      kind: "Service",
      metadata: {
        name: projectName,
      },
      spec: {
        selector: {
          app: projectName,
        },
        ports: [
          {
            name: "sandbox-port",
            port: 80,
            targetPort: "sandbox-port",
          },
          {
            name: "vscode-port",
            port: 81,
            targetPort: "vscode-port",
          },
        ],
      },
    }),
  ]);

  return { pod, service };
};

export const stopSandbox = async (
  projectName: string,
  deleteFiles: boolean
) => {
  try {
    await Promise.all([
      k8sApi.deleteNamespacedPod(projectName, config.sandboxNamespace),
      k8sApi.deleteNamespacedService(projectName, config.sandboxNamespace),
    ]);
  } catch (err) {
    console.error(err);
  }

  try {
    if (deleteFiles) {
      await rm(`${config.volumeRoot}/${projectName}`, { recursive: true });
    }
  } catch (err) {
    console.error(err);
  }
};

export const getAllPods = async () => {
  try {
    const pods = await k8sApi.listNamespacedPod(config.sandboxNamespace);
    return pods.body.items;
  } catch (err) {
    console.error(err.message);
  }
};

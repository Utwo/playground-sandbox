import { rm } from "node:fs/promises";
import stream from "node:stream";
import {
  CoreV1Api,
  type CoreV1Event,
  Exec,
  KubeConfig,
  Log,
  type V1Pod,
  makeInformer,
} from "@kubernetes/client-node";
import { type ContainerConfig, config } from "../config.ts";

const kc = new KubeConfig();
kc.loadFromDefault();
export const k8sExec = new Exec(kc);
export const k8sApi = kc.makeApiClient(CoreV1Api);
const k8sLog = new Log(kc);

export const initInformer = (io) => {
  const listFn = () =>
    k8sApi.listNamespacedEvent({ namespace: config.sandboxNamespace });

  const informer = makeInformer(
    kc,
    `/api/v1/namespaces/${config.sandboxNamespace}/pods`,
    listFn,
  );

  informer.on("add", (obj: V1Pod) => {
    io.to(obj?.metadata?.name).emit("sandbox:event", obj.status?.phase);
  });

  informer.on("update", (obj: V1Pod) => {
    io.to(obj?.metadata?.name).emit("sandbox:event", obj.status?.phase);
  });

  informer.on("error", (err: CoreV1Event) => {
    console.error(err);
    // Restart informer after 5sec
    setTimeout(() => {
      informer.start();
    }, 5000);
  });

  informer.start();
};

export const getPodStatus = async (projectName: string) => {
  const resp = await k8sApi.readNamespacedPodStatus({
    name: projectName,
    namespace: config.sandboxNamespace,
  });
  return resp;
};

export const sendLogsFromSandbox = (
  projectName: string,
  io,
  follow: boolean,
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
    },
  );
};

export const createSandbox = async (
  projectName: string,
  containerOptions: ContainerConfig,
) => {
  let tolerations = {};
  if (config.appEnv === "production") {
    tolerations = {
      nodeSelector: { node: "sandbox" },
      tolerations: [
        {
          key: "sandbox.gke.io/runtime",
          value: "gvisor",
          effect: "NoSchedule",
        },
      ],
    };
  }

  const [pod, service] = await Promise.all([
    k8sApi.createNamespacedPod({
      namespace: config.sandboxNamespace,
      body: {
        kind: "Pod",
        metadata: {
          name: projectName,
          labels: {
            app: projectName,
          },
        },
        spec: {
          restartPolicy: "Never",
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
          ...tolerations,
        },
      },
    }),
    k8sApi.createNamespacedService({
      namespace: config.sandboxNamespace,
      body: {
        kind: "Service",
        metadata: {
          name: projectName,
          annotations: {
            "cloud.google.com/backend-config":
              '{"default": "backendconfig-default"}',
          },
        },
        spec: {
          clusterIP: "None",
          selector: {
            app: projectName,
          },
          // ports: [
          //   {
          //     name: "sandbox-port",
          //     port: 80,
          //     targetPort: "sandbox-port",
          //   },
          //   {
          //     name: "vscode-port",
          //     port: 81,
          //     targetPort: "vscode-port",
          //   },
          // ],
        },
      },
    }),
  ]);

  return { pod, service };
};

export const stopSandbox = async (
  projectName: string,
  deleteFiles: boolean,
) => {
  try {
    await Promise.all([
      k8sApi.deleteNamespacedPod({
        name: projectName,
        namespace: config.sandboxNamespace,
      }),
      k8sApi.deleteNamespacedService({
        name: projectName,
        namespace: config.sandboxNamespace,
      }),
    ]);
  } catch (err) {
    console.error(err);
  }

  try {
    if (deleteFiles) {
      await rm(`${config.volumeRoot}/${projectName}`, {
        recursive: true,
        force: true,
      });
    }
  } catch (err) {
    console.error(err);
  }
};

export const getAllPods = async () => {
  try {
    const pods = await k8sApi.listNamespacedPod({
      namespace: config.sandboxNamespace,
    });
    return pods;
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(err.message);
    }
  }
};

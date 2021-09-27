import k8s from "@kubernetes/client-node";
import { rm, mkdir } from "fs/promises";
import tar from "tar";
import { config } from "../config.js";

const kc = new k8s.KubeConfig();
kc.loadFromDefault();
export const k8sExec = new k8s.Exec(kc);
export const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
export const k8sLog = new k8s.Log(kc);
export const k8sAttach = new k8s.Attach(kc);

export const createSandbox = async (projectName: string, template: string) => {
  const templateConfig = config.appTemplates[template];
  const projectPath = `/tmp/k3dvol/${projectName}`;

  const projectDir = await mkdir(projectPath, { recursive: true });
  if (projectDir) {
    await tar.x({
      file: `./app-templates/${templateConfig.archive}`,
      C: projectPath,
    });
  }

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
            image: templateConfig.image,
            workingDir: "/app",
            command: templateConfig.command,
            args: templateConfig.args,
            env: templateConfig.env,
            volumeMounts: [
              {
                name: "project-pv-storage",
                mountPath: "/app",
                subPath: projectName,
              },
            ],
            ports: [
              {
                containerPort: templateConfig.port,
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
            port: 80,
            // @ts-ignore
            targetPort: templateConfig.port,
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
      await rm(`/tmp/k3dvol/${projectName}`, { recursive: true });
    }
  } catch (err) {
    console.error(err);
  }
};

import { V1EnvVar } from "@kubernetes/client-node";

export type GitClone = {
  url: string;
  branch: string;
  path: string;
};

export type ContainerConfig = {
  image: string;
  command: string[];
  args: string[];
  port: number;
  env: V1EnvVar[];
};

export const config: {
  appEnv: string;
  sandboxNamespace: string;
  sandboxContainerName: string;
  vscodeContainerName: string;
  vscodeContainerPort: number;
  port: number;
  volumeRoot: string;
  removeInactiveSandboxAfter: number;
} = {
  appEnv: process.env.APP_ENV,
  sandboxNamespace: "public",
  sandboxContainerName: "node-app",
  vscodeContainerName: "vscode-app",
  vscodeContainerPort: 3773,
  port: +process.env.PORT || 8888,
  volumeRoot: "projects",
  removeInactiveSandboxAfter: 60 * 1000,
};

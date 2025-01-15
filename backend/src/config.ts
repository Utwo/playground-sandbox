import process from "node:process";
import type { V1EnvVar } from "@kubernetes/client-node";

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
  sandboxNodeLabel: string;
  sandboxNamespace: string;
  sandboxContainerName: string;
  vscodeContainerName: string;
  vscodeContainerPort: number;
  port: number;
  volumeRoot: string;
  removeInactiveSandboxAfter: number;
} = {
  sandboxNodeLabel: process.env.SANDBOX_NODE_LABEL || "sandbox",
  sandboxNamespace: process.env.SANDBOX_NAMESPACE || "public",
  sandboxContainerName: "node-app",
  vscodeContainerName: "vscode-app",
  vscodeContainerPort: 3773,
  port: +process.env.PORT || 8888,
  volumeRoot: "projects",
  removeInactiveSandboxAfter:
    +process.env.REMOVE_INACTIVE_SANDBOX_AFTER || 60 * 1000,
};

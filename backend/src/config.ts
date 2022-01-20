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
  sandboxNamespace: string;
  sandboxContainerName: string;
  port: number;
  volumeRoot: string;
} = {
  sandboxNamespace: "public",
  sandboxContainerName: "node-app",
  port: +process.env.PORT || 8888,
  volumeRoot: "/tmp/k3dvol",
};

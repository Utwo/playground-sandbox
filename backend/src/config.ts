import { V1EnvVar } from "@kubernetes/client-node";

export type GitClone = {
  url: string;
  branch: string;
};

export type AppTemplate = {
  image: string;
  command: string[];
  args: string[];
  port: number;
  env: V1EnvVar[];
  archive?: string;
};

export const config: {
  appTemplates: Record<string, AppTemplate>;
  sandboxNamespace: string;
  sandboxContainerName: string;
  port: number;
  volumeRoot: string;
} = {
  appTemplates: {
    nextApp: {
      image: "node:16-alpine",
      command: ["sh", "-c", "npm ci && npm run dev"],
      args: [],
      port: 3000,
      archive: "next-app.tar.gz",
      env: [],
    },
    nodeApp: {
      image: "node:16-alpine",
      command: ["sleep"],
      args: ["infinity"],
      port: 3000,
      archive: "node-app.tar.gz",
      env: [],
    },
  },
  sandboxNamespace: "public",
  sandboxContainerName: "node-app",
  port: +process.env.PORT || 8888,
  volumeRoot: "/tmp/k3dvol",
};

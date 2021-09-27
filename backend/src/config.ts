import { V1EnvVar } from "@kubernetes/client-node";

type appTemplate = {
  image: string;
  command: string[];
  args: string[];
  port: number;
  archive: string;
  env: V1EnvVar[];
};

export const config: {
  appTemplates: Record<string, appTemplate>;
  sandboxNamespace: string;
  sandboxContainerName: string;
  port: number;
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
};

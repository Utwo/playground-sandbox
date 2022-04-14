export const templateConfig = {
  nextApp: {
    gitUrl: "https://github.com/Utwo/next-sandbox",
    gitBranch: "main",
    gitPath: "/",
    image: "node:17",
    command: "npm run dev",
    port: 3000,
  },
  nuxtApp: {
    gitUrl: "https://github.com/Utwo/nuxt-sandbox",
    gitBranch: "main",
    gitPath: "/",
    image: "node:17",
    command: "npm run dev",
    port: 3000,
  },
  vueApp: {
    gitUrl: "https://github.com/vitejs/vite",
    gitBranch: "main",
    gitPath: "/packages/create-vite/template-vue",
    image: "node:17",
    command: "npm run dev -- --host --port 4000",
    port: 4000, // just to demonstrate that is working on different port
  },
};

export const sandboxHost = "project.127.0.0.1.nip.io:8888";
export const vsCodeHost = "vscode.127.0.0.1.nip.io:8888";
export const apiURL = "http://api.127.0.0.1.nip.io:8888";
export const wsURL = "ws://api.127.0.0.1.nip.io:8888";

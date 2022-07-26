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

const VITE_API_BACKEND = import.meta.env.VITE_API_BACKEND;
const VITE_API_PORT = import.meta.env.VITE_API_PORT;
export const sandboxHost = `project.${VITE_API_BACKEND}.nip.io:${VITE_API_PORT}`;
export const vsCodeHost = `vscode.${VITE_API_BACKEND}.nip.io:${VITE_API_PORT}`;
export const vsCodePort = "3773";
export const apiURL = `http://api.${VITE_API_BACKEND}.nip.io:${VITE_API_PORT}`;
export const apiUrlUS = `http://api.us.${VITE_API_BACKEND}.nip.io:${VITE_API_PORT}`;
export const apiUrlEU = `http://api.eu.${VITE_API_BACKEND}.nip.io:${VITE_API_PORT}`;

export const wsURL = {
  global: `ws://api.${VITE_API_BACKEND}.nip.io:${VITE_API_PORT}`,
  us: `ws://api.us.${VITE_API_BACKEND}.nip.io:${VITE_API_PORT}`,
  eu: `ws://api.eu.${VITE_API_BACKEND}.nip.io:${VITE_API_PORT}`,
};

export const templateConfig = {
  nextApp: {
    gitUrl: "https://github.com/Utwo/next-sandbox",
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
    command: "npm run dev -- --host",
    port: 3000,
  },
};

export const nginxDomain = "playground-sandbox.com:8088";

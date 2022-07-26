<template>
  <div ref="terminalRef" />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";
import { SearchAddon } from "xterm-addon-search";
// import { AttachAddon } from "xterm-addon-attach";
import { wsURL } from "../config";

import "xterm/css/xterm.css";

const defaultTheme = {
  foreground: "#ffffff",
  background: "#1b212f",
  cursor: "#ffffff",
  selection: "rgba(255, 255, 255, 0.3)",
  black: "#000000",
  brightBlack: "#808080",
  red: "#ce2f2b",
  brightRed: "#f44a47",
  green: "#00b976",
  brightGreen: "#05d289",
  yellow: "#e0d500",
  brightYellow: "#f4f628",
  magenta: "#bd37bc",
  brightMagenta: "#d86cd8",
  blue: "#1d6fca",
  brightBlue: "#358bed",
  cyan: "#00a8cf",
  brightCyan: "#19b8dd",
  white: "#e5e5e5",
  brightWhite: "#ffffff",
};

const props = defineProps({
  projectName: {
    type: String,
    required: true,
    default: "",
  },
  region: {
    type: String,
    required: false,
    default: "global",
  },
});

const terminalRef = ref(null);
const fitAddon = ref(new FitAddon());
const terminalWs = ref(null);
const term = ref(null);
const rows = ref(35);
const cols = ref(100);

term.value = new Terminal({
  rendererType: "canvas",
  rows: rows.value,
  cols: cols.value,
  scrollback: 10,
  fontSize: 18,
  cursorBlink: true,
  cursorStyle: "bar",
  bellStyle: "sound",
  theme: defaultTheme,
});

terminalWs.value = io(`${wsURL[props.region]}/${props.projectName}/terminal`, {
  transports: ["websocket"],
  forceNew: true,
});

terminalWs.value.on("connect", () => {
  term.value.write("\r\n*** Connected to backend***\r\n");
  // term.value.loadAddon(new AttachAddon(ws));
  term.value.focus();
});

term.value.loadAddon(fitAddon.value);
term.value.loadAddon(new WebLinksAddon());
term.value.loadAddon(new SearchAddon());
onMounted(() => {
  term.value.open(terminalRef.value);
  fitAddon.value.fit();
});

term.value.writeln(
  "Terminal (" + term.value.cols + "x" + term.value.rows + ")\n\r"
);

term.value.onKey((e) => {
  const ev = e.domEvent;
  if (ev.keyCode === 8 && term.value._core.buffer.x > 2) {
    // Do not delete the prompt
    term.value.write("\b \b");
  }
  terminalWs.value.emit("sandbox:exec", e.key);
});

terminalWs.value.on("sandbox:exec", (data) => {
  term.value.write(data);
});

terminalWs.value.on("disconnect", () => {
  term.value.write(
    "\r\n\nconnection has been terminated from the server-side\n"
  );
});

onUnmounted(() => {
  terminalWs.value.close();
});
</script>

<template>
  <div ref="logsRef" />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";
import { SearchAddon } from "xterm-addon-search";
import "xterm/css/xterm.css";
import { Socket } from "socket.io-client";

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
  socket: {
    type: Socket,
    required: true,
  },
});

const logsRef = ref(null);
const fitAddon = ref(new FitAddon());
const rows = ref(35);
const cols = ref(100);
const term = ref(
  new Terminal({
    rendererType: "canvas",
    rows: rows.value,
    cols: cols.value,
    convertEol: true,
    scrollback: 10,
    disableStdin: true,
    fontSize: 18,
    cursorBlink: true,
    cursorStyle: "bar",
    bellStyle: "sound",
    theme: defaultTheme,
  })
);

term.value.loadAddon(fitAddon.value);
term.value.loadAddon(new WebLinksAddon());
term.value.loadAddon(new SearchAddon());

props.socket.on("sandbox:log:data", (data) => {
  term.value.write(data);
});
props.socket.on("disconnect", () => {
  term.value.cursorBlink = false;
  term.value.write("\r\n*** Socket closed ***\r\n");
});

onMounted(() => {
  term.value.open(logsRef.value);
  fitAddon.value.fit();
});
</script>

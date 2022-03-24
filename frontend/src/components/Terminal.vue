<template>
  <div ref="terminal" />
</template>

<script>
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

export default {
  props: {
    projectName: {
      type: String,
      required: true,
      default: "",
    },
  },
  data() {
    return {
      fitAddon: new FitAddon(),
      searchKey: "",
      terminalWs: null,
      term: null,
      rows: 35,
      cols: 100,
    };
  },
  mounted: function () {
    this.term = new Terminal({
      rendererType: "canvas",
      rows: this.rows,
      cols: this.cols,
      scrollback: 10,
      fontSize: 18,
      cursorBlink: true,
      cursorStyle: "bar",
      bellStyle: "sound",
      theme: defaultTheme,
    });

    this.terminalWs = io(`${wsURL}/${this.projectName}/terminal`, {
      transports: ["websocket"],
      forceNew: true,
    });

    this.terminalWs.on("connect", () => {
      this.term.write("\r\n*** Connected to backend***\r\n");
      // this.term.loadAddon(new AttachAddon(ws));
      this.term.focus();
    });

    this.term.loadAddon(this.fitAddon);
    this.term.loadAddon(new WebLinksAddon());
    this.term.loadAddon(new SearchAddon());

    this.term.open(this.$refs.terminal);
    this.fitAddon.fit();
    this.term.writeln(
      "Terminal (" + this.term.cols + "x" + this.term.rows + ")\n\r"
    );

    this.term.onKey((e) => {
      const ev = e.domEvent;
      if (ev.keyCode === 8 && term._core.buffer.x > 2) {
        // Do not delete the prompt
        this.term.write("\b \b");
      }
      this.terminalWs.emit("sandbox:exec", e.key);
    });

    this.terminalWs.on("sandbox:exec", (data) => {
      this.term.write(data);
    });

    this.terminalWs.on("disconnect", () => {
      this.term.write(
        "\r\n\nconnection has been terminated from the server-side\n"
      );
    });
  },
  unmounted() {
    this.terminalWs.close();
  },
  methods: {
    onWindowResize() {
      this.fitAddon.fit();
    },
  },
};
</script>

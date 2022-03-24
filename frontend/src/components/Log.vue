<template>
  <div ref="terminal" />
</template>

<script>
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

export default {
  props: {
    socket: {
      type: Socket,
      required: true,
    },
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
      convertEol: true,
      scrollback: 10,
      disableStdin: true,
      fontSize: 18,
      cursorBlink: true,
      cursorStyle: "bar",
      bellStyle: "sound",
      theme: defaultTheme,
    });
    this.term.loadAddon(this.fitAddon);
    this.term.loadAddon(new WebLinksAddon());
    this.term.loadAddon(new SearchAddon());

    this.term.open(this.$refs.terminal);
    this.fitAddon.fit();

    this.socket.on("sandbox:log:data", (data) => {
      this.term.write(data);
    });
    this.socket.on("disconnect", () => {
      this.term.cursorBlink = false;
      this.term.write("\r\n*** Socket closed ***\r\n");
    });
  },

  methods: {
    onWindowResize() {
      this.fitAddon.fit();
    },
    doClose() {
      window.removeEventListener("resize", this.onWindowResize);
      if (this.ws) {
        this.ws.close();
      }
      if (this.term) {
        this.term.dispose();
      }
    },
  },
};
</script>

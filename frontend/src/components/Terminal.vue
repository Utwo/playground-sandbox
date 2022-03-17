<template>
  <div ref="terminal" />
</template>

<script>
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";
import { SearchAddon } from "xterm-addon-search";
import { AttachAddon } from "xterm-addon-attach";

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
      ws: null,
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
    this.term.loadAddon(this.fitAddon);
    this.term.loadAddon(new WebLinksAddon());
    this.term.loadAddon(new SearchAddon());
    this.term.loadAddon(new AttachAddon(this.socket));

    this.term.open(this.$refs.terminal);
    this.fitAddon.fit();
    this.term.focus();
    this.term.writeln(
      "Terminal (" + this.term.cols + "x" + this.term.rows + ")\n\r"
    );

    this.term.onKey((e) => {
      const ev = e.domEvent;
      const printable = !ev.altKey && !ev.ctrlKey && !ev.metaKey;
      if (ev.keyCode === 13) {
        this.term.write("\r\n");
      } else if (ev.keyCode === 8) {
        // Do not delete the prompt
        if (term._core.buffer.x > 2) {
          this.term.write("\b \b");
        }
      } else if (printable) {
        this.term.write(e.key);
      }
      this.socket.emit("sandbox:attach:data", e.key);
    });

    this.socket.on("sandbox:attach:data", (data) => {
      this.term.write(data);
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

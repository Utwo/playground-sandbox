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
const bindTerminalResize = (term, websocket) => {
  const onTermResize = (size) => {
    // websocket.send(
    //   JSON.stringify({
    //     type: 'resize',
    //     rows: size.rows,
    //     cols: size.cols
    //   })
    // )
    // websocket.send("2" + Base64.encode(size.rows + ":" + size.cols));
  };
  // register resize event.
  term.onTermResize("resize", onTermResize);
  // unregister resize event when WebSocket closed.
  websocket.addEventListener("close", function () {
    term.off("resize", onTermResize);
  });
};

const bindTerminal = (term, websocket, bidirectional, bufferedTime) => {
  term.socket = websocket;
  let messageBuffer = null;
  const handleWebSocketMessage = function (ev) {
    if (bufferedTime && bufferedTime > 0) {
      if (messageBuffer) {
        messageBuffer += ev.data;
      } else {
        messageBuffer = ev.data;
        setTimeout(function () {
          term.write(messageBuffer);
        }, bufferedTime);
      }
    } else {
      term.write(ev.data);
    }
  };

  const handleTerminalData = function (data) {
    websocket.send("0" + Base64.encode(data));
    // term.write(data)
  };

  websocket.onmessage = handleWebSocketMessage;
  if (bidirectional) {
    term.on("data", handleTerminalData);
  }

  websocket.addEventListener("close", function () {
    websocket.removeEventListener("message", handleWebSocketMessage);
    term.off("data", handleTerminalData);
    delete term.socket;
    clearInterval(heartBeatTimer);
  });
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
      convertEol: true,
      scrollback: 10,
      disableStdin: false,
      fontSize: 18,
      cursorBlink: true,
      cursorStyle: "bar",
      bellStyle: "sound",
      theme: defaultTheme,
    });
    this.term.loadAddon(this.fitAddon);
    this.term.loadAddon(new WebLinksAddon());
    this.term.loadAddon(new SearchAddon());

    this.term.prompt = () => {
      this.term.write("\r\n");
    };
    this.term.prompt();

    // this.term.onKey(function (key, ev) {
    //   console.log(key, ev);
    // });
    this.term.open(this.$refs.terminal);
    // this.term.onResize("resize", this.onWindowResize);
    // window.addEventListener("resize", this.onWindowResize);
    this.fitAddon.fit();

    this.socket.on("sandbox:log:data", (data) => {
      this.term.write(data);
    });

    // this.ws.onclose = () => {
    //   this.term.setOption("cursorBlink", false);
    //   this.$message("console.web_socket_disconnect");
    // };
    // bindTerminal(this.term, this.ws, true, -1);
    // bindTerminalResize(this.term, this.ws);
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

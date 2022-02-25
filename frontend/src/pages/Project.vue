<template>
  <div class="main">
    <div class="sidebar">
      <TreeView
        :socket="socket"
        :project-name="$route.params.projectName"
        @file-selected="onFileSelect"
        @file-deleted="onFileDelete"
        @file-add="onFileAdd"
      />
    </div>
    <div class="code_editor">
      <CodeEditor
        :socket="socket"
        :project-name="$route.params.projectName"
        :file-path="filePath"
      />
    </div>
    <div class="preview">
      <Iframe :project-name="$route.params.projectName" />
    </div>
    <div class="terminal">
      <Terminal :socket="socket" :project-name="$route.params.projectName" />
    </div>
  </div>
</template>

<script>
import { io } from "socket.io-client";
import { createSandbox, stopSandbox } from "../services/httpApi";
import Terminal from "../components/Terminal.vue";
import Iframe from "../components/Iframe.vue";
import CodeEditor from "../components/CodeEditor.vue";
import TreeView from "../components/TreeView.vue";

export default {
  components: {
    Terminal,
    Iframe,
    CodeEditor,
    TreeView,
  },
  data() {
    return {
      socket: null,
      filePath: "",
    };
  },
  created: function () {
    const { projectName } = this.$route.params;
    const { gitUrl, gitBranch, gitPath, image, command, port } =
      this.$route.query;
    const query = {
      projectName,
      gitUrl,
      gitBranch,
      gitPath,
      image,
      command,
      port,
    };

    this.socket = io("ws://localhost:8888", {
      transports: ["websocket"],
      query,
    });
    this.socket.on("connect", () => {
      console.log("connected");
    });
  },
  unmounted() {
    this.socket.close();
  },
  methods: {
    onCreateSandbox() {
      createSandbox({
        projectName: this.$route.params.projectName,
        template: this.$route.params.template,
      });
    },
    onStopSandbox() {
      stopSandbox({
        projectName: this.$route.params.projectName,
        deleteFiles: true,
      });
    },
    onFileSelect(item) {
      this.filePath = item.path;
    },
    onFileDelete(item) {
      this.socket.emit("files:delete", { files: { [item.path]: null } });
    },
    onFileAdd(path) {
      this.socket.emit("files:add", { files: { [path]: "" } });
    },
  },
};
</script>

<style scoped>
.main {
  display: grid;
  grid-template-columns: 350px repeat(2, 1fr);
  grid-template-rows: 40px repeat(4, 1fr);
  grid-column-gap: 0px;
  grid-row-gap: 0px;
  height: 100vh;
}

.sidebar {
  grid-area: 1 / 1 / 6 / 2;
}
.code_editor {
  grid-area: 1 / 2 / 6 / 3;
}
.preview {
  grid-area: 1 / 3 / 4 / 4;
}
.terminal {
  grid-area: 4 / 3 / 6 / 4;
  overflow-y: scroll;
  overflow-x: hidden;
}
</style>

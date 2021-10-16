<template>
  <div class="container-fluid">
    <div class="row g-0">
      <div class="col-3">
        <TreeView
          :socket="socket"
          :project-name="$route.params.projectName"
          @file-selected="onFileSelect"
          @file-deleted="onFileDelete"
        />
      </div>
      <div class="col-4">
        <CodeEditor
          :socket="socket"
          :project-name="$route.params.projectName"
          :file-path="filePath"
        />
      </div>
      <div class="col-5">
        <div class="iframe">
          <Iframe :project-name="$route.params.projectName" />
        </div>
        <div class="terminal-wrapper">
          <Terminal
            :socket="socket"
            :project-name="$route.params.projectName"
          />
        </div>
      </div>
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
    const { template, gitUrl, gitBranch, image, command, port } =
      this.$route.query;
    const query = template
      ? { projectName, template }
      : { projectName, gitUrl, gitBranch, image, command, port };

    this.socket = io("ws://localhost:8888", {
      transports: ["websocket"],
      query,
    });
    this.socket.on("connect", () => {
      console.log("connected");
    });
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
  },
};
</script>

<style scoped>
.iframe {
  height: 80vh;
}

.terminal-wrapper {
  height: 20vh;
  overflow-y: scroll;
  overflow-x: hidden;
}
</style>

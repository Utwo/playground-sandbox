<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-6">
        <div class="input-group">
          <input
            type="text"
            class="form-control"
            v-model="projectName"
            placeholder="pod-example"
          />
          <select v-model="template" class="form-select">
            <option value="nextApp" selected>nextjs</option>
            <option value="nodeApp">node</option>
          </select>
        </div>
      </div>
      <div class="col-6">
        <button type="button" class="btn btn-primary" @click="onCreateSandbox">
          Create Sandbox
        </button>
        <button type="button" class="btn btn-danger" @click="onStopSandbox">
          Stop Sandbox
        </button>
      </div>
    </div>
    <div class="row g-0">
      <div class="col-4">
        <CodeEditor :socket="socket" :project-name="projectName" />
      </div>
      <div class="col-4">
        <Terminal :socket="socket" :project-name="projectName" />
      </div>
      <div class="col-4"><Iframe :project-name="projectName" /></div>
    </div>
  </div>
</template>

<script>
import { io } from "socket.io-client";
import { createSandbox, stopSandbox } from "../services/httpApi";
import Terminal from "./Terminal.vue";
import Iframe from "./Iframe.vue";
import CodeEditor from "./CodeEditor.vue";

export default {
  components: {
    Terminal,
    Iframe,
    CodeEditor,
  },
  data() {
    return {
      projectName: "pod-example",
      template: "nextApp",
      socket: null,
    };
  },
  created: function () {
    this.socket = io("ws://localhost:8888", {
      transports: ["websocket"],
      query: { projectName: "pod-example" },
    });
    this.socket.on("connect", () => {
      console.log("connected");
    });
  },
  methods: {
    onCreateSandbox() {
      console.log(this.template);
      createSandbox({
        projectName: this.projectName,
        template: this.template,
      });
    },
    onStopSandbox() {
      stopSandbox({
        projectName: this.projectName,
        deleteFiles: true,
      });
    },
  },
};
</script>

<style scoped>
a {
  color: #42b983;
}
</style>

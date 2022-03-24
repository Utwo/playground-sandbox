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
      <a :href="vsCodeHost" class="btn btn-primary w-100" target="_blanck"
        >Open in VSCode</a
      >
    </div>
    <div class="code_editor">
      <CodeEditor
        :socket="socket"
        :project-name="$route.params.projectName"
        :file-path="filePath"
      />
    </div>
    <div class="preview">
      <Iframe :socket="socket" :project-name="$route.params.projectName" />
    </div>
    <div class="terminal">
      <tabs v-model="selectedTab" @update:modelValue="onUpdateTab">
        <tab
          v-for="(tab, i) in tabs"
          :key="`t${i}`"
          :val="tab"
          :label="tab"
          :indicator="true"
        />
      </tabs>
      <tab-panels v-model="selectedTab">
        <tab-panel v-for="(tab, i) in tabs" :key="`tp${i}`" :val="tab">
          <div v-if="tab === 'Terminal'">
            <Terminal :project-name="$route.params.projectName" />
          </div>
          <div v-if="tab === 'Logs'">
            <Log :socket="socket" :project-name="$route.params.projectName" />
          </div>
        </tab-panel>
      </tab-panels>
    </div>
  </div>
</template>

<script>
import { io } from "socket.io-client";
import { Tabs, Tab, TabPanels, TabPanel } from "vue3-tabs";
import { createSandbox, stopSandbox } from "../services/httpApi";
import Log from "../components/Log.vue";
import Iframe from "../components/Iframe.vue";
import CodeEditor from "../components/CodeEditor.vue";
import TreeView from "../components/TreeView.vue";
import Terminal from "../components/Terminal.vue";
import { wsURL, vsCodeHost } from "../config";

export default {
  components: {
    Log,
    Iframe,
    CodeEditor,
    TreeView,
    Terminal,
    Tabs,
    Tab,
    TabPanels,
    TabPanel,
  },
  data() {
    return {
      socket: null,
      filePath: "",
      tabs: ["Logs", "Terminal", "+"],
      selectedTab: "Logs",
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

    this.socket = io(wsURL, {
      transports: ["websocket"],
      query,
    });
  },
  unmounted() {
    this.socket.close();
  },
  computed: {
    vsCodeHost() {
      const { projectName } = this.$route.params;
      return `http://${projectName}.${vsCodeHost}/?folder=/home/workspace`;
    },
  },
  methods: {
    onUpdateTab(tab) {
      if (tab === "+") {
        this.tabs.splice(
          this.tabs.length - 1,
          0,
          `Terminal ${this.tabs.length - 1}`
        );
        this.selectedTab = this.tabs.at[-1];
      }
    },
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
  display: flex;
  flex-direction: column;
}
.terminal {
  grid-area: 4 / 3 / 6 / 4;
  overflow-y: scroll;
  overflow-x: hidden;
}
.tabs {
  background: #fff;
}
</style>

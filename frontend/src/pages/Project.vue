<template>
  <div class="main">
    <div class="sidebar">
      <TreeView
        :socket="socket"
        :project-name="route.params.projectName"
        @file-selected="onFileSelect"
        @file-deleted="onFileDelete"
        @file-added="onFileAdd"
      />
      <a :href="vsCodeURL" class="btn btn-primary w-100" target="_blanck"
        >Open in VSCode</a
      >
    </div>
    <div class="code_editor">
      <CodeEditor
        :socket="socket"
        :project-name="route.params.projectName"
        :file-path="filePath"
      />
    </div>
    <div class="preview">
      <Iframe :socket="socket" :project-name="route.params.projectName" />
    </div>
    <div class="terminal">
      <ul class="nav nav-tabs">
        <li v-for="(tab, i) in tabs" :key="`tab-${i}`" class="nav-item">
          <button
            :class="['nav-link', { active: currentTab.label === tab.label }]"
            @click="updateTab"
          >
            {{ tab.label }}
          </button>
        </li>
      </ul>
      <KeepAlive>
        <component
          :is="currentTab.value"
          :socket="socket"
          :project-name="$route.params.projectName"
          :key="currentTab.label"
        ></component>
      </KeepAlive>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted, computed, shallowRef } from "vue";
import { io } from "socket.io-client";
import Log from "../components/Log.vue";
import Iframe from "../components/Iframe.vue";
import CodeEditor from "../components/CodeEditor.vue";
import TreeView from "../components/TreeView.vue";
import Terminal from "../components/Terminal.vue";
import { wsURL, vsCodeHost } from "../config";
import { useRoute } from "vue-router";

const route = useRoute();
const { projectName } = route.params;
const { gitUrl, gitBranch, gitPath, image, command, port } = route.query;

const query = {
  projectName,
  gitUrl,
  gitBranch,
  gitPath,
  image,
  command,
  port,
};

const socket = ref(
  io(wsURL, {
    transports: ["websocket"],
    query,
  })
);
const filePath = ref("");
const tabs = shallowRef([
  { label: "Logs", value: Log },
  { label: "+", value: null },
]);
const currentTab = ref({ label: "Logs", value: Log });

const vsCodeURL = computed(() => {
  const { projectName } = route.params;
  return `http://${projectName}.${vsCodeHost}/?folder=/home/workspace`;
});

onUnmounted(() => {
  socket.value.close();
});

const updateTab = (event) => {
  if (event.target.textContent === "+") {
    tabs.value.splice(tabs.value.length - 1, 0, {
      label: `Terminal ${tabs.value.length - 1}`,
      value: Terminal,
    });
    currentTab.value = tabs.value.at(-2);
  } else {
    currentTab.value = tabs.value.find(
      (tab) => tab.label === event.target.textContent
    );
  }
};

const onFileSelect = (item) => {
  filePath.value = item.path;
};
const onFileDelete = (item) => {
  socket.value.emit("files:delete", { files: { [item.path]: null } });
};
const onFileAdd = (path) => {
  socket.value.emit("files:add", { files: { [path]: "" } });
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

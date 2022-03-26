<template>
  <Tree
    :nodes="nodes"
    :config="config"
    @node-focus="onFileSelected"
    @node-blur="onFileDeselected"
  />
  <div>
    <form @submit.prevent="addNewFile" class="input-group mb-3">
      <input
        type="text"
        class="form-control"
        placeholder="pages/index.js"
        v-model="addFilePath"
      />
      <button
        class="btn btn-outline-secondary"
        type="button"
        @click="addNewFile"
      >
        Add file
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import Tree from "vue3-treeview";
import "vue3-treeview/dist/style.css";

const props = defineProps(["projectName", "socket"]);
const emit = defineEmits(["file-deleted", "file-selected", "file-added"]);

const addFilePath = ref(null);
const selectedFile = ref(null);
const nodes = ref([]);
const config = ref({
  roots: [],
  editable: true,
  dragAndDrop: true,
});

onMounted(() => {
  props.socket.on("sandbox:files:tree", (sockNodes) => {
    nodes.value = sockNodes;
    config.value.roots = Object.keys(sockNodes).filter(
      (nodeId) => sockNodes[nodeId].isRoot
    );
  });
  props.socket.on("files:deleted", ({ files }) => {
    Object.keys(files).forEach((fileId) => {
      delete nodes.value[fileId];
    });
  });
  window.addEventListener("keydown", onKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", onKeyDown);
});

const onKeyDown = (ev) => {
  if (ev.key === "Delete" && selectedFile.value) {
    delete nodes.value[selectedFile.value.path];
    emit("file-deleted", selectedFile.value);
  }
};

const onFileSelected = (item) => {
  selectedFile.value = item;
  emit("file-selected", item);
};

const onFileDeselected = () => {
  selectedFile.value = null;
};

const addNewFile = () => {
  if (!addFilePath.value) {
    return;
  }
  const node = {
    id: addFilePath.value,
    name: addFilePath.value,
    path: addFilePath.value,
    text: addFilePath.value,
    isRoot: false,
  };
  if (addFilePath.value.includes("/")) {
    node.text = addFilePath.value.split("/").slice(0, -1).join("/");
    node.isRoot = true;
    console.log(node);
  }
  nodes.value[addFilePath.value] = node;
  emit("file-added", addFilePath.value);
  addFilePath.value = null;
};
</script>

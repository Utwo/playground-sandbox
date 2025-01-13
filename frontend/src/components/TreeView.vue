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
import { onMounted, onUnmounted, ref } from "vue";
import Tree from "vue3-treeview";
import "vue3-treeview/dist/style.css";
import { Socket } from "socket.io-client";

const props = defineProps({
  projectName: {
    type: String,
    required: true,
    default: "",
  },
  socket: {
    type: Socket,
    required: true,
  },
});

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
      (nodeId) => sockNodes[nodeId].isRoot,
    );
  });
  props.socket.on("files:deleted", ({ files }) => {
    for (const fileId of Object.keys(files)) {
      delete nodes.value[fileId];
    }
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

  addFilePath.value =
    addFilePath.value[0] === "/"
      ? addFilePath.value.substring(1)
      : addFilePath.value;

  const node = {
    id: addFilePath.value,
    name: addFilePath.value,
    path: addFilePath.value,
    parent: null,
    text: addFilePath.value,
  };

  if (addFilePath.value.includes("/")) {
    // the node is not added in the root
    const pathArray = addFilePath.value.split("/");
    const parrentArray = pathArray.slice(0, -1);
    node.text = pathArray.at(-1);
    node.name = pathArray.at(-1);
    node.parent = parrentArray.join("/");
    addFolder(parrentArray);
    nodes.value[node.parent].children.push(addFilePath.value);
  } else {
    config.value.roots.push(node.id);
  }
  nodes.value[addFilePath.value] = node;
  emit("file-added", addFilePath.value);
  addFilePath.value = null;
};

const addFolder = (folderArray) => {
  let folderPath = "";
  for (const [i, folder] of folderArray.entries()) {
    folderPath += folderPath === "" ? folder : `/${folder}`;

    if (!nodes.value[folderPath]) {
      const children =
        i !== folderArray.length - 1
          ? [folderArray.slice(i, i + 2).join("/")]
          : [];

      const node = {
        id: folderPath,
        name: folder,
        path: folderPath,
        text: folder,
        children,
      };

      if (i === 0) {
        config.value.roots.push(folder);
        node.parent = null;
      }

      nodes.value[folderPath] = node;
    }
  }
};
</script>

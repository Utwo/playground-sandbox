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

<script>
import { defineComponent } from "vue";
import { Socket } from "socket.io-client";
import Tree from "vue3-treeview";
import "vue3-treeview/dist/style.css";

export default defineComponent({
  name: "App",
  components: {
    Tree,
  },
  props: {
    projectName: {
      type: String,
      default: "",
      required: true,
    },
    socket: {
      type: Socket,
      required: true,
    },
  },
  data: function () {
    return {
      addFilePath: null,
      selectedFile: null,
      nodes: [],
      config: {
        roots: [],
        // editable: true,
        dragAndDrop: true,
      },
    };
  },
  mounted() {
    this.socket.on("sandbox:files:tree", (nodes) => {
      this.nodes = nodes;
      this.config.roots = Object.keys(nodes).filter(
        (nodeId) => nodes[nodeId].isRoot
      );
    });
    this.socket.on("files:deleted", ({ files }) => {
      Object.keys(files).forEach((fileId) => {
        delete this.nodes[fileId];
      });
    });
    window.addEventListener("keydown", this.onKeyDown);
  },

  destroyed() {
    window.removeEventListener("keydown");
  },
  methods: {
    onKeyDown(ev) {
      if (ev.key === "Delete" && this.selectedFile) {
        delete this.nodes[this.selectedFile.path];
        this.$emit("file-deleted", this.selectedFile);
      }
    },
    onFileSelected: function (item) {
      this.selectedFile = item;
      this.$emit("file-selected", item);
    },
    onFileDeselected: function () {
      this.selectedFile = null;
    },
    addNewFile: function () {
      if (!this.addFilePath) {
        return;
      }
      const node = {
        id: this.addFilePath,
        name: this.addFilePath,
        path: this.addFilePath,
        text: this.addFilePath,
        isRoot: false,
      };
      if (this.addFilePath.includes("/")) {
        node.text = this.addFilePath.split("/").slice(0, -1).join("/");
        node.isRoot = true;
      }
      this.nodes[this.addFilePath] = node;
      this.$emit("file-add", this.addFilePath);
      this.addFilePath = null;
    },
  },
});
</script>

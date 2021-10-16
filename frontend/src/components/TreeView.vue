<template>
  <Tree
    :nodes="nodes"
    :config="config"
    @node-focus="onFileSelected"
    @node-blur="onFileDeselected"
  />
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
      this.config.roots = Object.keys(nodes).map((nodeId) => {
        if (nodes[nodeId].isRoot) {
          return nodeId;
        }
      });
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
  },
});
</script>

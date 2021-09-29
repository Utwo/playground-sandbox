<template>
  <file-item
    class="item"
    :item="treeData"
    @make-folder="makeFolder"
    @add-item="addItem"
    @file-selected="fileSelected"
  ></file-item>
</template>

<script>
import FileItem from "./FileItem.vue";
import { Socket } from "socket.io-client";

export default {
  components: {
    FileItem,
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
      treeData: {},
    };
  },
  mounted() {
    this.socket.on("sandbox:files:tree", (treeData) => {
      this.treeData = treeData;
    });
  },
  methods: {
    makeFolder: function (item) {
      item.children = [];
      this.addItem(item);
    },
    addItem: function (item) {
      item.children.push({
        name: "new stuff",
      });
    },
    fileSelected: function (item) {
      this.$emit("file-selected", item);
    },
  },
};
</script>

<style scoped>
.item {
  cursor: pointer;
}
</style>

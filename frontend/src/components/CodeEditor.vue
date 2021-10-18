<template>
  <div class="d-flex flex-column h-100">
    <div class="d-grid gap-2">
      <button type="button" class="btn btn-primary btn-block" @click="save">
        Save
      </button>
    </div>
    <prism-editor
      class="my-editor"
      v-model="editorCode"
      :highlight="highlighter"
      line-numbers
    ></prism-editor>
  </div>
</template>

<script>
import { PrismEditor } from "vue-prism-editor";
import "vue-prism-editor/dist/prismeditor.min.css";
import prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import { Socket } from "socket.io-client";
import { getFileContent } from "./../services/httpApi";

export default {
  components: {
    PrismEditor,
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
    filePath: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      editorCode: "",
    };
  },
  watch: {
    filePath: function (newVal, oldVal) {
      getFileContent({
        projectName: this.projectName,
        filePath: newVal,
      }).then(async (res) => {
        this.editorCode = await res.text();
      });
    },
  },
  methods: {
    highlighter(code) {
      return prism.highlight(code, prism.languages.js);
    },
    save() {
      this.socket.emit("files:add", {
        files: { [this.filePath]: this.editorCode },
      });
    },
  },
};
</script>

<style scoped>
.my-editor {
  background: #2d2d2d;
  color: #ccc;
  font-family: Fira code, Fira Mono, Consolas, Menlo, Courier, monospace;
  font-size: 16px;
  line-height: 1.5;
  padding: 5px;
}
</style>

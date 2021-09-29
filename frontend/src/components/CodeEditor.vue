<template>
  <prism-editor
    class="my-editor"
    v-model="editorCode"
    :highlight="highlighter"
    line-numbers
  ></prism-editor>
  <button type="button" class="btn btn-info" @click="save">save</button>
</template>

<script>
import { PrismEditor } from "vue-prism-editor";
import "vue-prism-editor/dist/prismeditor.min.css";
import prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import { Socket } from "socket.io-client";
import { addFiles, getFileContent } from "./../services/httpApi";

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
      addFiles({
        projectName: this.projectName,
        files: { [this.filePath]: this.editorCode },
      });
    },
  },
};
</script>

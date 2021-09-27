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
import { addFiles } from "./../services/httpApi";

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
  },
  data() {
    return {
      editorCode: "",
    };
  },
  mounted() {
    this.editorCode = "//hello";
  },
  methods: {
    highlighter(code) {
      return prism.highlight(code, prism.languages.js);
    },
    save() {
      addFiles({
        projectName: this.projectName,
        files: { "pages/home.js": this.editorCode },
      });
    },
  },
};
</script>

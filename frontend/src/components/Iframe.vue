<template>
  <div class="d-flex">
    <input
      type="text"
      class="form-control"
      v-model="path"
      v-on:keyup.enter="changePath"
    />
    <button class="btn btn-small btn-secondary" @click="reloadIframe">
      Reload
    </button>
  </div>
  <iframe
    :src="iframeSrc"
    crossorigin="anonymous"
    target="_parent"
    ref="iframe"
    allow=" camera; geolocation; microphone"
    sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
  ></iframe>
</template>

<script>
export default {
  props: {
    projectName: {
      type: String,
      required: true,
    },
  },
  data: function () {
    return {
      path: "/",
      iframeSrc: `http://${this.projectName}.playground-sandbox.com:8000`,
    };
  },
  methods: {
    reloadIframe() {
      this.$refs.iframe.src = this.iframeSrc;
    },
    changePath() {
      this.iframeSrc = `http://${this.projectName}.playground-sandbox.com:8000${this.path}`;
    },
  },
};
</script>

<style scoped>
iframe {
  visibility: visible;
  border: 1px solid #333;
  width: 100%;
  height: 100%;
}
</style>

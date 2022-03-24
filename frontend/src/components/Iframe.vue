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
  <div v-if="loading">
    <h2>Loading...</h2>
    <ul>
      <li v-for="event in events">{{ event }}</li>
    </ul>
  </div>
  <iframe
    :src="iframeSrc"
    v-if="!loading"
    crossorigin="anonymous"
    target="_parent"
    ref="iframe"
    allow=" camera; geolocation; microphone"
    sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
  ></iframe>
</template>

<script>
import { Socket } from "socket.io-client";
import { sandboxHost } from "../config";

export default {
  props: {
    socket: {
      type: Socket,
      required: true,
    },
    projectName: {
      type: String,
      required: true,
    },
  },
  data: function () {
    return {
      path: "/",
      iframeSrc: `http://${this.projectName}.${sandboxHost}`,
      loading: true,
      interval: null,
      events: [],
    };
  },
  mounted() {
    this.interval = setInterval(() => {
      fetch(this.iframeSrc)
        .then(() => {
          this.loading = false;
          clearInterval(this.interval);
        })
        .catch(() => {
          this.loading = true;
        });
    }, 1000);

    this.socket.on("sandbox:event", (data) => {
      this.events.push(data);
    });
  },
  unmounted() {
    clearInterval(this.interval);
  },
  methods: {
    reloadIframe() {
      this.$refs.iframe.src = this.iframeSrc;
    },
    changePath() {
      this.iframeSrc = `http://${this.projectName}.${sandboxHost}${this.path}`;
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

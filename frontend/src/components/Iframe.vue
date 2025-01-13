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
    v-if="!loading"
    crossorigin="anonymous"
    target="_parent"
    :src="iframeSrc"
    allow=" camera; geolocation; microphone"
    sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
  ></iframe>
</template>

<script setup>
import { Socket } from "socket.io-client";
import { onMounted, onUnmounted, ref } from "vue";
import { sandboxHost } from "../config";

const props = defineProps({
  projectName: {
    type: String,
    default: "",
    required: true,
  },
  port: {
    type: Number,
    default: 3000,
    required: false,
  },
  socket: {
    type: Socket,
    required: true,
  },
});

const path = ref("/");
const iframeSrc = ref(
  `http://${props.projectName}-${props.port}.${sandboxHost}`,
);
const loading = ref(true);
const interval = ref(null);
const events = ref([]);

const reloadIframe = () => {
  iframeSrc.value += "/";
};
const changePath = () => {
  iframeSrc.value = `http://${props.projectName}-${props.port}.${sandboxHost}${path.value}`;
};

onMounted(() => {
  interval.value = setInterval(() => {
    fetch(iframeSrc.value).then((res) => {
      if (res.status !== 200) {
        return;
      }
      loading.value = false;
      clearInterval(interval.value);
    });
  }, 1000);

  props.socket.on("sandbox:event", (data) => {
    events.value.push(data);
  });
});

onUnmounted(() => {
  clearInterval(interval.value);
});
</script>

<style scoped>
iframe {
  visibility: visible;
  border: 1px solid #333;
  width: 100%;
  height: 100%;
}
</style>

<template>
  <a :href="iframeSrc">{{ iframeSrc }}</a>
  <iframe
    :src="iframeSrc"
    crossorigin="anonymous"
    target="_parent"
    allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
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
  computed: {
    iframeSrc() {
      return `http://${this.projectName}.playground-sandbox.com:8000`;
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

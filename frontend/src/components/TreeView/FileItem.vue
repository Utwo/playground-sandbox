<template>
  <ul v-if="Array.isArray(item)">
    <file-item
      class="item"
      v-for="(child, index) in item"
      :key="index"
      :item="child"
      @make-folder="$emit('make-folder', $event)"
      @add-item="$emit('add-item', $event)"
      @file-selected="$emit('file-selected', $event)"
    ></file-item>
    <li class="add" @click="$emit('add-item', item)">+</li>
  </ul>
  <li v-else>
    <div :class="{ bold: isFolder }" @click="toggle">
      {{ item.name }}
      <span v-if="isFolder">[{{ isOpen ? "-" : "+" }}]</span>
    </div>
    <ul v-show="isOpen" v-if="isFolder">
      <file-item
        class="item"
        v-for="(child, index) in item.children"
        :key="index"
        :item="child"
        @make-folder="$emit('make-folder', $event)"
        @add-item="$emit('add-item', $event)"
        @file-selected="$emit('file-selected', $event)"
      ></file-item>
      <li class="add" @click="$emit('add-item', item)">+</li>
    </ul>
  </li>
</template>

<script>
export default {
  props: {
    item: Object | Array,
  },
  data: function () {
    return {
      isOpen: false,
    };
  },
  computed: {
    isFolder: function () {
      return this.item.children && this.item.children.length;
    },
  },
  methods: {
    toggle: function () {
      if (this.isFolder) {
        this.isOpen = !this.isOpen;
        return;
      }

      this.$emit("file-selected", this.item);
    },
  },
};
</script>

<style scoped>
.bold {
  font-weight: bold;
}
ul {
  padding-left: 1em;
  line-height: 1.5em;
  list-style-type: none;
}
</style>

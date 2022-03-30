<template>
  <div class="d-flex justify-content-center">
    <div class="card mt-4" style="width: 24rem">
      <div class="card-body">
        <h1 class="card-title h5">Playground Sandbox</h1>
        <div class="mb-3">
          <label for="projectName" class="form-label">Project Name</label>
          <input
            type="text"
            id="projectName"
            class="form-control"
            v-model="projectName"
            placeholder="pod-example"
          />
        </div>
        <ul class="nav nav-tabs nav-fill mb-3">
          <li class="nav-item">
            <a
              class="nav-link"
              :class="{ active: isTemplate }"
              @click="isTemplate = true"
              aria-current="page"
              href="#"
              >From Template</a
            >
          </li>
          <li class="nav-item">
            <a
              class="nav-link"
              :class="{ active: !isTemplate }"
              @click="isTemplate = false"
              href="#"
              >From Github</a
            >
          </li>
        </ul>
        <div v-show="isTemplate">
          <div class="mb-3">
            <label for="templateType" class="form-label">Template</label>
            <select v-model="template" class="form-select" id="templateType">
              <option value="nextApp" selected>nextjs</option>
              <option value="nuxtApp" selected>nuxtjs</option>
              <option value="vueApp" selected>vue</option>
            </select>
          </div>
        </div>
        <div v-show="!isTemplate">
          <div class="mb-3">
            <label for="gitUrl" class="form-label">Git URL</label>
            <input
              type="text"
              id="gitUrl"
              class="form-control"
              v-model="gitUrl"
              placeholder="git@github.com:Utwo/playground-sandbox.git"
            />
          </div>
          <div class="mb-3">
            <label for="gitBranch" class="form-label">Git Branch</label>
            <input
              type="text"
              id="gitBranch"
              class="form-control"
              v-model="gitBranch"
              placeholder="main"
            />
          </div>
          <div class="mb-3">
            <label for="gitPath" class="form-label">Git Path</label>
            <input
              type="text"
              id="gitPath"
              class="form-control"
              v-model="gitPath"
              placeholder="/"
            />
          </div>
          <div class="mb-3">
            <label for="image" class="form-label">Image URL</label>
            <input
              type="text"
              id="image"
              class="form-control"
              v-model="image"
              placeholder="node:16-alpine"
            />
          </div>
          <div class="mb-3">
            <label for="command" class="form-label">Start Command</label>
            <input
              type="text"
              id="command"
              class="form-control"
              v-model="command"
              placeholder="npm run dev"
            />
          </div>
          <div class="mb-3">
            <label for="port" class="form-label">Port</label>
            <input
              type="text"
              id="port"
              class="form-control"
              v-model="port"
              placeholder="3000"
            />
          </div>
        </div>
        <div class="d-grid gap-2">
          <router-link
            :to="{
              name: 'Project',
              params: {
                projectName,
              },
              query: routeQueryString,
            }"
            class="btn btn-primary"
            >Start project</router-link
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { computed } from "@vue/reactivity";
import { templateConfig } from "../config";

const isTemplate = ref(true);
const projectName = ref("pod-example");
const template = ref("nextApp");
const gitUrl = ref("");
const gitBranch = ref("main");
const gitPath = ref("/");
const image = ref("node:17");
const command = ref("npm run dev");
const port = ref(3000);

const routeQueryString = computed({
  get() {
    if (isTemplate.value) {
      return templateConfig[template.value];
    }

    return {
      gitUrl: gitUrl.value,
      gitBranch: gitBranch.value,
      image: image.value,
      command: command.value,
      port: port.value,
    };
  },
});
</script>

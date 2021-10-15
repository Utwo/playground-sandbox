<template>
  <div class="d-flex justify-content-center">
    <div class="card mt-4" style="width: 18rem">
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
        <div class="mb-3">
          <label for="templateType" class="form-label">Project Name</label>
          <select v-model="template" class="form-select" id="templateType">
            <option value="nextApp" selected>nextjs</option>
            <option value="nodeApp">node</option>
          </select>
        </div>
        <div class="mb-3">
          <label for="gitURL" class="form-label">Git URL</label>
          <input
            type="text"
            id="gitURL"
            class="form-control"
            v-model="gitURL"
            placeholder="git@github.com:Utwo/playground-sandbox.git"
          />
        </div>
        <div class="d-grid gap-2">
          <router-link
            :to="{ name: 'Project', params: { projectName, template } }"
            class="btn btn-primary btn-block"
            >Start project</router-link
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  components: {},
  data() {
    return {
      projectName: "pod-example",
      template: "nextApp",
    };
  },
};
</script>

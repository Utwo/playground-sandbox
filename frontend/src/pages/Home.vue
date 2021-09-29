<template>
  <div class="d-flex justify-content-center">
    <div class="card mt-4" style="width: 18rem">
      <div class="card-body">
        <h1 class="card-title h5">Playground Sandbox</h1>
        <div class="form-group">
          <label for="projectName">Project Name</label>
          <input
            type="text"
            id="projectName"
            class="form-control"
            v-model="projectName"
            placeholder="pod-example"
          />
        </div>
        <div class="form-group">
          <label for="templateType">Project Name</label>
          <select v-model="template" class="form-select" id="templateType">
            <option value="nextApp" selected>nextjs</option>
            <option value="nodeApp">node</option>
          </select>
        </div>

        <router-link
          :to="{ name: 'Project', params: { projectName, template } }"
          class="btn btn-primary btn-block"
          >Start project</router-link
        >
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

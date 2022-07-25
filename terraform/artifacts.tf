resource "google_artifact_registry_repository" "sandbox-repo" {
  location      = var.region
  repository_id = "sandbox"
  description   = "Sandbox docker repository"
  format        = "DOCKER"
}

resource "google_artifact_registry_repository_iam_member" "k8s-artifact" {
  project    = google_artifact_registry_repository.sandbox-repo.project
  location   = google_artifact_registry_repository.sandbox-repo.location
  repository = google_artifact_registry_repository.sandbox-repo.name
  role       = "roles/artifactregistry.writer"
  member     = "serviceAccount:${module.k8s_cluster.k8s_sa}"
}

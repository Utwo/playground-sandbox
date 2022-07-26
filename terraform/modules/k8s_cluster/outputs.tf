output "k8s_id" {
  value = google_container_cluster.gke_cluster.id
}

output "k8s_endpoint" {
  value = google_container_cluster.gke_cluster.endpoint
}

output "google_gke_hub_membership_fleet" {
  value = google_gke_hub_membership.cluster_fleet.id
}

output "filestore_id" {
  value = google_filestore_instance.sandbox_instance.id
}

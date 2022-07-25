output "k8s_id" {
  value = google_container_cluster.gke_cluster.id
}

output "k8s_endpoint" {
  value = google_container_cluster.gke_cluster.endpoint
}

output "k8s_sa" {
  value = google_service_account.gke_sa.email
}

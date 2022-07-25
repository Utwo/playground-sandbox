output "k8s_id" {
  value = module.k8s_cluster.k8s_id
}

output "k8s_endpoint" {
  value = module.k8s_cluster.k8s_endpoint
}

output "filestore_id" {
  value = google_filestore_instance.sandbox_instance.id
}

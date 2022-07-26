output "k8s_id_eu" {
  value = module.k8s_cluster.k8s_id
}

output "k8s_endpoint_eu" {
  value = module.k8s_cluster.k8s_endpoint
}

output "k8s_id_us" {
  value = module.k8s_cluster_us.k8s_id
}

output "k8s_endpoint_us" {
  value = module.k8s_cluster_us.k8s_endpoint
}

output "filestore_id" {
  value = google_filestore_instance.sandbox_instance.id
}

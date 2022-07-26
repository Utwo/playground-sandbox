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

output "filestore_id_eu" {
  value = module.k8s_cluster.filestore_id
}

output "filestore_id_us" {
  value = module.k8s_cluster_us.filestore_id
}

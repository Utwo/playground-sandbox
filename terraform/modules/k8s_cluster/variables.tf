variable "project_id" {
  description = "GCP project id"
  type        = string
}

variable "k8s_cluster_name" {
  description = "Name of the k8s cluster"
  type        = string
}

variable "region" {
  description = "Region where to deploy the infra"
  type        = string
}

variable "zone" {
  description = "Zone where to deploy the infra"
  type        = string
}

variable "sa_email" {
  description = "Service account email for k8s node pools"
  type        = string
}

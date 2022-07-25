terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "4.29.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

module "k8s_cluster" {
  source = "./modules/k8s_cluster"

  # Input Variables
  k8s_cluster_name = var.k8s_cluster_name
  region           = var.region
  zone             = var.zone
  project_id       = var.project_id
}

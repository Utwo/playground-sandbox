terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "4.29.0"
    }
  }
}

module "k8s_cluster" {
  source = "./modules/k8s_cluster"

  # Input Variables
  k8s_cluster_name = var.k8s_cluster_name
  region           = var.region
  zone             = var.zone
  project_id       = var.project_id
  sa_email         = google_service_account.gke_sa.email
}

module "k8s_cluster_us" {
  source = "./modules/k8s_cluster"

  # Input Variables
  k8s_cluster_name = "${var.k8s_cluster_name}-us"
  region           = var.region_secondary
  zone             = var.zone_secondary
  project_id       = var.project_id
  sa_email         = google_service_account.gke_sa.email
}

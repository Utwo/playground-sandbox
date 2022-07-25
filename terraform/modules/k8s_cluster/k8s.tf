resource "google_service_account" "gke_sa" {
  account_id   = "gke-sa"
  display_name = "Service Account for GKE cluster"
}

resource "google_container_cluster" "gke_cluster" {
  provider = google-beta
  name     = var.k8s_cluster_name
  location = "${var.region}-${var.zone}"
  # We can't create a cluster with no node pool defined, but we want to only use
  # separately managed node pools. So we create the smallest possible default
  # node pool and immediately delete it.
  remove_default_node_pool = true
  initial_node_count       = 1
  networking_mode          = "VPC_NATIVE"

  ip_allocation_policy {
    cluster_ipv4_cidr_block  = ""
    services_ipv4_cidr_block = ""
  }

  addons_config {
    gce_persistent_disk_csi_driver_config {
      enabled = true
    }
  }

  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }
}

resource "google_container_node_pool" "primary_preemptible_nodes" {
  provider   = google-beta
  name       = "default-node-pool"
  cluster    = google_container_cluster.gke_cluster.name
  node_count = 2
  location   = "${var.region}-${var.zone}"

  node_config {
    preemptible  = true
    machine_type = "e2-medium"

    labels = {
      node = "default"
    }

    # Google recommends custom service accounts that have cloud-platform scope and permissions granted via IAM Roles.
    service_account = google_service_account.gke_sa.email
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }
}

resource "google_container_node_pool" "sandbox_nodes" {
  provider = google-beta
  name     = "sandbox-pool"
  cluster  = google_container_cluster.gke_cluster.name
  location = "${var.region}-${var.zone}"

  autoscaling {
    min_node_count = 0
    max_node_count = 3
  }

  node_config {
    preemptible  = true
    machine_type = "e2-standard-2"

    sandbox_config {
      sandbox_type = "gvisor"
    }

    labels = {
      node = "sandbox"
    }

    # Google recommends custom service accounts that have cloud-platform scope and permissions granted via IAM Roles.
    service_account = google_service_account.gke_sa.email
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }
}

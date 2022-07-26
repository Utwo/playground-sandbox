resource "google_gke_hub_membership" "cluster_fleet" {
  provider      = google-beta
  membership_id = "${var.k8s_cluster_name}-membership"
  authority {
    issuer = "https://container.googleapis.com/v1/${google_container_cluster.gke_cluster.id}"
  }

  endpoint {
    gke_cluster {
      resource_link = "//container.googleapis.com/${google_container_cluster.gke_cluster.id}"
    }
  }
}

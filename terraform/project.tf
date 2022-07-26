resource "google_project_service" "services" {
  for_each                   = toset(local.activate_services)
  service                    = each.key
  disable_dependent_services = false
  disable_on_destroy         = false
}

resource "google_gke_hub_feature" "feature" {
  provider = google-beta
  name     = "multiclusterservicediscovery"
  location = "global"
}

resource "google_gke_hub_feature" "feature_ingress" {
  provider = google-beta
  name     = "multiclusteringress"
  location = "global"
  spec {
    multiclusteringress {
      config_membership = module.k8s_cluster.google_gke_hub_membership_fleet
    }
  }
}

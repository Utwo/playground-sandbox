resource "google_service_account" "gke_sa" {
  account_id   = "gke-sa"
  display_name = "Service Account for GKE cluster"
}

resource "google_project_iam_member" "project" {
  project = var.project_id
  role    = "roles/compute.networkViewer"
  member  = "serviceAccount:${var.project_id}.svc.id.goog[gke-mcs/gke-mcs-importer]"
}

resource "google_project_iam_member" "multiclusteringress" {
  project = var.project_id
  role    = "roles/container.admin"
  member  = "serviceAccount:service-${var.project_number}@gcp-sa-multiclusteringress.iam.gserviceaccount.com"
}


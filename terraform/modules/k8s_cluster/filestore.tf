resource "google_filestore_instance" "sandbox_instance" {
  name        = "${var.k8s_cluster_name}-sandbox"
  description = "Filestore for the playground sandbox k8s prototype."
  location    = "${var.region}-${var.zone}"
  tier        = "BASIC_HDD"

  file_shares {
    capacity_gb = 1024
    name        = "sandbox"
  }

  networks {
    network = "default"
    modes   = ["MODE_IPV4"]
  }
}

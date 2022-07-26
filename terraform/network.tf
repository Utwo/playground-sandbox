resource "google_compute_global_address" "k8s_ip_address" {
  name         = "playgrund-sandbox"
  address_type = "EXTERNAL"
  description  = "Static external IP Address for k8s cluster"
}

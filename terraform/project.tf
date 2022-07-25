resource "google_project_service" "services" {
  for_each                   = toset(local.activate_services)
  service                    = each.key
  disable_dependent_services = false
  disable_on_destroy         = false
}

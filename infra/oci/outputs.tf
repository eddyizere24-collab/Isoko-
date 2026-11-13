output "instance_name" {
  description = "Name of the ISOKO foundation VM."
  value       = oci_core_instance.app.display_name
}

output "instance_public_ip" {
  description = "Public IPv4 address for HTTP/HTTPS. SSH is closed unless an admin CIDR was deliberately configured."
  value       = oci_core_instance.app.public_ip
}

output "private_assets_bucket" {
  description = "Private Object Storage bucket name."
  value       = oci_objectstorage_bucket.assets.name
}

output "vcn_id" {
  description = "ISOKO VCN OCID."
  value       = oci_core_vcn.isoko.id
}

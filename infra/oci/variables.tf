variable "tenancy_ocid" {
  description = "OCI tenancy OCID. Never commit credentials or private keys."
  type        = string
}

variable "compartment_ocid" {
  description = "OCID of the dedicated ISOKO compartment."
  type        = string
}

variable "region" {
  description = "The tenancy home region. Always Free resources must be created in this region."
  type        = string
}

variable "availability_domain" {
  description = "Optional availability-domain name. Leave empty to use the first AD returned by OCI."
  type        = string
  default     = ""
}

variable "image_ocid" {
  description = "OCID of an Always Free eligible Ubuntu ARM64 image in the selected home region."
  type        = string
}

variable "ssh_public_key" {
  description = "Public SSH key only. The matching private key must never be committed."
  type        = string
  sensitive   = true
}

variable "admin_ssh_cidr" {
  description = "Optional single trusted admin CIDR for temporary SSH. Leave empty to keep public SSH closed. Never use 0.0.0.0/0."
  type        = string
  default     = ""

  validation {
    condition     = var.admin_ssh_cidr == "" || can(cidrhost(var.admin_ssh_cidr, 0))
    error_message = "admin_ssh_cidr must be empty or a valid CIDR range."
  }
}

variable "object_bucket_name" {
  description = "Unique, private Object Storage bucket name for ISOKO assets."
  type        = string
  default     = "isoko-private-assets"

  validation {
    condition     = length(var.object_bucket_name) >= 3 && length(var.object_bucket_name) <= 255
    error_message = "object_bucket_name must be between 3 and 255 characters."
  }
}

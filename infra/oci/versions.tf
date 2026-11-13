terraform {
  required_version = ">= 1.14.0"

  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "= 9.12.1"
    }
  }
}

provider "oci" {
  region = var.region
}

# Triple Fusion OS: Enterprise Infrastructure as Code (Terraform)
# Provider: Google Cloud Platform (GCP) / Kubernetes (GKE)

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

variable "gcp_project_id" {
  type    = string
  default = "bull-logic-prod"
}

variable "gcp_region" {
  type    = string
  default = "us-central1"
}

# ── Cloud Run Production API Service ──────────────────────────────────────────
resource "google_cloud_run_v2_service" "api_backend" {
  name     = "triple-fusion-api"
  location = var.gcp_region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    scaling {
      min_instance_count = 2
      max_instance_count = 50
    }

    containers {
      image = "gcr.io/${var.gcp_project_id}/django-backend:v3.5.0-RC2"
      resources {
        limits = {
          cpu    = "4"
          memory = "8Gi"
        }
      }
      env {
        name  = "DJANGO_SETTINGS_MODULE"
        value = "bulllogic.settings"
      }
    }
  }
}

# ── Cloud SQL PostgreSQL 15 Instance ──────────────────────────────────────────
resource "google_sql_database_instance" "postgres_master" {
  name             = "triple-fusion-pg15-master"
  database_version = "POSTGRES_15"
  region           = var.gcp_region

  settings {
    tier              = "db-custom-8-32768" # 8 vCPU, 32GB RAM
    availability_type = "REGIONAL"          # High Availability Failover
    backup_configuration {
      enabled    = true
      start_time = "02:00"
    }
  }
}

# ── Memorystore Redis Enterprise Cache & Event Bus ────────────────────────────
resource "google_redis_instance" "redis_cache" {
  name           = "triple-fusion-redis-prod"
  tier           = "STANDARD_HA"
  memory_size_gb = 16
  region         = var.gcp_region
}

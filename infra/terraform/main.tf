terraform {
  required_version = ">= 1.0.0"
  
  backend "s3" {
    bucket         = "question-paper-generator-tf-state"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "question-paper-generator-tf-lock"
    encrypt        = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Network Module
module "network" {
  source = "./modules/network"
  
  environment = var.environment
  vpc_cidr    = var.vpc_cidr
}

# Auth Module
module "auth" {
  source = "./modules/auth"
  
  environment = var.environment
  app_name    = var.app_name
}

# Storage Module
module "storage" {
  source = "./modules/storage"
  
  environment = var.environment
  app_name    = var.app_name
}

# Database Module
module "database" {
  source = "./modules/database"
  
  environment = var.environment
  app_name    = var.app_name
}

# Compute Module
module "compute" {
  source = "./modules/compute"
  
  environment       = var.environment
  app_name          = var.app_name
  vpc_id            = module.network.vpc_id
  private_subnet_ids = module.network.private_subnet_ids
  user_pool_id      = module.auth.user_pool_id
  user_pool_client_id = module.auth.user_pool_client_id
  question_bucket_id = module.storage.question_bucket_id
  question_bucket_arn = module.storage.question_bucket_arn
  generated_bucket_id = module.storage.generated_bucket_id
  generated_bucket_arn = module.storage.generated_bucket_arn
  papers_table_name  = module.database.papers_table_name
  papers_table_arn   = module.database.papers_table_arn
}

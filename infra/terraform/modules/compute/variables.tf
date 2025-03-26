variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "app_name" {
  description = "Application name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "user_pool_id" {
  description = "Cognito User Pool ID"
  type        = string
}

variable "user_pool_client_id" {
  description = "Cognito User Pool Client ID"
  type        = string
}

variable "user_pool_arn" {
  description = "Cognito User Pool ARN"
  type        = string
  default     = ""
}

variable "question_bucket_id" {
  description = "S3 bucket ID for question PDFs"
  type        = string
}

variable "question_bucket_arn" {
  description = "S3 bucket ARN for question PDFs"
  type        = string
}

variable "generated_bucket_id" {
  description = "S3 bucket ID for generated papers"
  type        = string
}

variable "generated_bucket_arn" {
  description = "S3 bucket ARN for generated papers"
  type        = string
}

variable "papers_table_name" {
  description = "DynamoDB table name for papers"
  type        = string
}

variable "papers_table_arn" {
  description = "DynamoDB table ARN for papers"
  type        = string
}

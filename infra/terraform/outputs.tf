output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.network.vpc_id
}

output "user_pool_id" {
  description = "The ID of the Cognito User Pool"
  value       = module.auth.user_pool_id
}

output "user_pool_client_id" {
  description = "The ID of the Cognito User Pool Client"
  value       = module.auth.user_pool_client_id
}

output "user_pool_domain" {
  description = "The domain name of the Cognito User Pool"
  value       = module.auth.user_pool_domain
}

output "question_bucket_id" {
  description = "The ID of the S3 bucket for question PDFs"
  value       = module.storage.question_bucket_id
}

output "generated_bucket_id" {
  description = "The ID of the S3 bucket for generated papers"
  value       = module.storage.generated_bucket_id
}

output "papers_table_name" {
  description = "The name of the DynamoDB table for papers"
  value       = module.database.papers_table_name
}

output "api_gateway_url" {
  description = "The URL of the API Gateway"
  value       = module.compute.api_gateway_url
}

output "lambda_function_name" {
  description = "The name of the Lambda function"
  value       = module.compute.lambda_function_name
}

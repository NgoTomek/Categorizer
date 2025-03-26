output "lambda_function_name" {
  description = "The name of the Lambda function"
  value       = aws_lambda_function.api_lambda.function_name
}

output "lambda_function_arn" {
  description = "The ARN of the Lambda function"
  value       = aws_lambda_function.api_lambda.arn
}

output "api_gateway_id" {
  description = "The ID of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.api.id
}

output "api_gateway_root_resource_id" {
  description = "The resource ID of the API Gateway root"
  value       = aws_api_gateway_rest_api.api.root_resource_id
}

output "api_gateway_url" {
  description = "The URL of the API Gateway"
  value       = "${aws_api_gateway_deployment.api.invoke_url}"
}

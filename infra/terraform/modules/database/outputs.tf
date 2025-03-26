output "papers_table_name" {
  description = "The name of the DynamoDB papers table"
  value       = aws_dynamodb_table.papers.name
}

output "papers_table_arn" {
  description = "The ARN of the DynamoDB papers table"
  value       = aws_dynamodb_table.papers.arn
}

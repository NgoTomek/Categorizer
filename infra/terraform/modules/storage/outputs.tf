output "question_bucket_id" {
  description = "The ID of the question PDFs bucket"
  value       = aws_s3_bucket.question_pdfs.id
}

output "question_bucket_arn" {
  description = "The ARN of the question PDFs bucket"
  value       = aws_s3_bucket.question_pdfs.arn
}

output "generated_bucket_id" {
  description = "The ID of the generated papers bucket"
  value       = aws_s3_bucket.generated_papers.id
}

output "generated_bucket_arn" {
  description = "The ARN of the generated papers bucket"
  value       = aws_s3_bucket.generated_papers.arn
}

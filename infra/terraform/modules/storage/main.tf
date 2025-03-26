resource "aws_s3_bucket" "question_pdfs" {
  bucket = "${var.environment}-${var.app_name}-question-pdfs"
  
  tags = {
    Name        = "${var.environment}-${var.app_name}-question-pdfs"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "question_pdfs_versioning" {
  bucket = aws_s3_bucket.question_pdfs.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "question_pdfs_encryption" {
  bucket = aws_s3_bucket.question_pdfs.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "question_pdfs_public_access" {
  bucket = aws_s3_bucket.question_pdfs.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket" "generated_papers" {
  bucket = "${var.environment}-${var.app_name}-generated-papers"
  
  tags = {
    Name        = "${var.environment}-${var.app_name}-generated-papers"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "generated_papers_lifecycle" {
  bucket = aws_s3_bucket.generated_papers.id
  
  rule {
    id     = "expiration"
    status = "Enabled"
    
    expiration {
      days = 30
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "generated_papers_encryption" {
  bucket = aws_s3_bucket.generated_papers.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "generated_papers_public_access" {
  bucket = aws_s3_bucket.generated_papers.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CORS configuration for the generated papers bucket
resource "aws_s3_bucket_cors_configuration" "generated_papers_cors" {
  bucket = aws_s3_bucket.generated_papers.id
  
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET"]
    allowed_origins = ["*"] # In production, restrict this to your frontend domain
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

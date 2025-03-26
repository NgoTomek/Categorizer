resource "aws_dynamodb_table" "papers" {
  name           = "${var.environment}-${var.app_name}-papers"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "paperId"
  
  attribute {
    name = "paperId"
    type = "S"
  }
  
  attribute {
    name = "userId"
    type = "S"
  }
  
  attribute {
    name = "createdAt"
    type = "S"
  }
  
  global_secondary_index {
    name               = "UserPapersIndex"
    hash_key           = "userId"
    range_key          = "createdAt"
    projection_type    = "ALL"
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  tags = {
    Name        = "${var.environment}-${var.app_name}-papers"
    Environment = var.environment
  }
}

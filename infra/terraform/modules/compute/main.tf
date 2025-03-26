###
# Lambda Function
###

# IAM role for the Lambda function
resource "aws_iam_role" "lambda_role" {
  name = "${var.environment}-${var.app_name}-lambda-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Lambda basic execution policy (CloudWatch Logs)
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda VPC execution policy
resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Custom policy for S3 and DynamoDB access
resource "aws_iam_policy" "lambda_custom_policy" {
  name        = "${var.environment}-${var.app_name}-lambda-custom-policy"
  description = "Policy for Lambda to access S3 and DynamoDB"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Effect   = "Allow"
        Resource = [
          var.question_bucket_arn,
          "${var.question_bucket_arn}/*"
        ]
      },
      {
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Effect   = "Allow"
        Resource = [
          var.generated_bucket_arn,
          "${var.generated_bucket_arn}/*"
        ]
      },
      {
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Effect   = "Allow"
        Resource = [
          var.papers_table_arn,
          "${var.papers_table_arn}/index/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_custom" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_custom_policy.arn
}

# Lambda function
resource "aws_lambda_function" "api_lambda" {
  function_name    = "${var.environment}-${var.app_name}-api"
  role             = aws_iam_role.lambda_role.arn
  handler          = "app.handler"
  runtime          = "python3.9"
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  
  environment {
    variables = {
      ENVIRONMENT        = var.environment
      QUESTION_BUCKET    = var.question_bucket_id
      GENERATED_BUCKET   = var.generated_bucket_id
      PAPERS_TABLE       = var.papers_table_name
      USER_POOL_ID       = var.user_pool_id
      USER_POOL_CLIENT_ID = var.user_pool_client_id
    }
  }
  
  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [aws_security_group.lambda_sg.id]
  }
  
  timeout     = 30
  memory_size = 256
  
  tags = {
    Name        = "${var.environment}-${var.app_name}-api"
    Environment = var.environment
  }
}

# Create a zip file of the lambda code
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda.zip"
  source_dir  = "${path.module}/../../../backend"
  excludes    = ["__pycache__", "*.pyc", "*.pyo", "*.dist-info"]
}

# Security group for Lambda
resource "aws_security_group" "lambda_sg" {
  name        = "${var.environment}-${var.app_name}-lambda-sg"
  description = "Security group for Lambda function"
  vpc_id      = var.vpc_id
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name        = "${var.environment}-${var.app_name}-lambda-sg"
    Environment = var.environment
  }
}

###
# API Gateway
###

# API Gateway REST API
resource "aws_api_gateway_rest_api" "api" {
  name        = "${var.environment}-${var.app_name}-api"
  description = "API Gateway for Question Paper Generator"
  
  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# API Gateway authorizer using Cognito
resource "aws_api_gateway_authorizer" "cognito" {
  name          = "cognito-authorizer"
  rest_api_id   = aws_api_gateway_rest_api.api.id
  type          = "COGNITO_USER_POOLS"
  provider_arns = [var.user_pool_arn]
}

# API Gateway resource for login endpoint
resource "aws_api_gateway_resource" "login" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "login"
}

# API Gateway POST method for login
resource "aws_api_gateway_method" "login_post" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.login.id
  http_method   = "POST"
  authorization_type = "NONE"
}

# API Gateway integration for login
resource "aws_api_gateway_integration" "login_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.login.id
  http_method             = aws_api_gateway_method.login_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_lambda.invoke_arn
}

# API Gateway resource for subjects endpoint
resource "aws_api_gateway_resource" "subjects" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "subjects"
}

# API Gateway GET method for subjects
resource "aws_api_gateway_method" "subjects_get" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.subjects.id
  http_method   = "GET"
  authorization_type = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

# API Gateway integration for subjects
resource "aws_api_gateway_integration" "subjects_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.subjects.id
  http_method             = aws_api_gateway_method.subjects_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_lambda.invoke_arn
}

# API Gateway resource for topics endpoint
resource "aws_api_gateway_resource" "topics" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "topics"
}

# API Gateway GET method for topics
resource "aws_api_gateway_method" "topics_get" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.topics.id
  http_method   = "GET"
  authorization_type = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

# API Gateway integration for topics
resource "aws_api_gateway_integration" "topics_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.topics.id
  http_method             = aws_api_gateway_method.topics_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_lambda.invoke_arn
}

# API Gateway resource for generate endpoint
resource "aws_api_gateway_resource" "generate" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "generate"
}

# API Gateway POST method for generate
resource "aws_api_gateway_method" "generate_post" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.generate.id
  http_method   = "POST"
  authorization_type = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

# API Gateway integration for generate
resource "aws_api_gateway_integration" "generate_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.generate.id
  http_method             = aws_api_gateway_method.generate_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_lambda.invoke_arn
}

# API Gateway resource for download endpoint
resource "aws_api_gateway_resource" "download" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "download"
}

# API Gateway resource for paperId
resource "aws_api_gateway_resource" "paper_id" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_resource.download.id
  path_part   = "{paperId}"
}

# API Gateway GET method for download
resource "aws_api_gateway_method" "download_get" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.paper_id.id
  http_method   = "GET"
  authorization_type = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
  
  request_parameters = {
    "method.request.path.paperId" = true
  }
}

# API Gateway integration for download
resource "aws_api_gateway_integration" "download_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.paper_id.id
  http_method             = aws_api_gateway_method.download_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_lambda.invoke_arn
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "api" {
  depends_on = [
    aws_api_gateway_integration.login_lambda,
    aws_api_gateway_integration.subjects_lambda,
    aws_api_gateway_integration.topics_lambda,
    aws_api_gateway_integration.generate_lambda,
    aws_api_gateway_integration.download_lambda
  ]
  
  rest_api_id = aws_api_gateway_rest_api.api.id
  stage_name  = var.environment
  
  lifecycle {
    create_before_destroy = true
  }
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  
  source_arn = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

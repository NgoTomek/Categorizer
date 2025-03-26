resource "aws_cognito_user_pool" "main" {
  name = "${var.environment}-${var.app_name}-user-pool"
  
  username_attributes = ["email"]
  auto_verify_attributes = ["email"]
  
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = true
  }
  
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject = "Your verification code"
    email_message = "Your verification code is {####}"
  }
  
  schema {
    name                = "email"
    attribute_data_type = "String"
    mutable             = true
    required            = true
  }
  
  schema {
    name                = "name"
    attribute_data_type = "String"
    mutable             = true
    required            = true
  }
  
  tags = {
    Environment = var.environment
  }
}

resource "aws_cognito_user_pool_client" "main" {
  name = "${var.environment}-${var.app_name}-client"
  
  user_pool_id = aws_cognito_user_pool.main.id
  
  generate_secret     = false
  explicit_auth_flows = [
    "ALLOW_ADMIN_USER_PASSWORD_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]
  
  prevent_user_existence_errors = "ENABLED"
  
  access_token_validity  = 1
  id_token_validity      = 1
  refresh_token_validity = 30
  
  token_validity_units {
    access_token  = "days"
    id_token      = "days"
    refresh_token = "days"
  }
}

resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${var.environment}-${var.app_name}"
  user_pool_id = aws_cognito_user_pool.main.id
}

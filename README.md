# Question Paper Generator

This application allows educators to generate custom question papers by selecting topics and configuring settings.

## Architecture

The Question Paper Generator uses a serverless architecture on AWS:

- **Frontend**: React application using AWS Amplify for authentication
- **Backend**: FastAPI application running on AWS Lambda
- **Storage**: S3 buckets for question PDFs and generated papers
- **Database**: DynamoDB for storing paper metadata
- **Authentication**: Amazon Cognito for user management

![Architecture Diagram](docs/architecture.png)

## Repository Structure

```
infra/terraform/ - Terraform configuration for AWS infrastructure
backend/         - FastAPI backend application
frontend/        - React frontend application
.github/         - GitHub Actions workflows for CI/CD
```

## Local Development

### Prerequisites

- Node.js 16+
- Python 3.9+
- AWS CLI configured with appropriate credentials
- Terraform 1.0+

### Backend Development

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a virtual environment and install dependencies:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows, use: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Run the development server:
   ```
   uvicorn app:app --reload
   ```

4. The API will be available at http://localhost:8000

### Frontend Development

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.local` file with your AWS configuration:
   ```
   REACT_APP_API_ENDPOINT=http://localhost:8000
   REACT_APP_USER_POOL_ID=your-user-pool-id
   REACT_APP_USER_POOL_CLIENT_ID=your-user-pool-client-id
   REACT_APP_AWS_REGION=your-aws-region
   ```

4. Run the development server:
   ```
   npm start
   ```

5. The application will be available at http://localhost:3000

## Deployment

The application uses GitHub Actions for CI/CD. When you push changes to the main branch, it will:

1. Apply Terraform configuration to provision/update AWS resources
2. Deploy the backend Lambda function
3. Build and deploy the frontend to S3
4. Invalidate CloudFront cache

You can also manually trigger a deployment to a specific environment (dev, staging, prod) using the GitHub Actions workflow dispatch.

## Testing

### Backend Tests

```
cd backend
pytest
```

### Frontend Tests

```
cd frontend
npm test
```

### End-to-End Tests

```
cd frontend
npm run cypress:open
```

## Project Roadmap

- [x] Basic infrastructure setup
- [x] Authentication system
- [x] Question paper generation
- [x] PDF preview and download
- [ ] User dashboard for past papers
- [ ] Admin panel for managing questions
- [ ] Custom templates for different paper formats
- [ ] Sharing and collaboration features

## License

This project is licensed under the MIT License - see the LICENSE file for details.

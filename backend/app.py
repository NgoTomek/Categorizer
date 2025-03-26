import os
import json
import boto3
import time
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from fastapi import FastAPI, Depends, HTTPException, Security, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from mangum import Mangum

from models import (
    LoginRequest, 
    LoginResponse, 
    Subject, 
    Topic, 
    PaperGenerationRequest, 
    PaperGenerationResponse,
    DownloadResponse
)
from utils import (
    validate_jwt, 
    get_cognito_tokens, 
    list_s3_folders, 
    list_s3_files, 
    combine_pdfs, 
    create_presigned_url
)

# Initialize FastAPI app
app = FastAPI(
    title="Question Paper Generator API",
    description="API for generating custom question papers",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security scheme
security = HTTPBearer()

# AWS clients
dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

# Environment variables
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'dev')
QUESTION_BUCKET = os.environ.get('QUESTION_BUCKET', f"{ENVIRONMENT}-question-paper-generator-question-pdfs")
GENERATED_BUCKET = os.environ.get('GENERATED_BUCKET', f"{ENVIRONMENT}-question-paper-generator-generated-papers")
PAPERS_TABLE = os.environ.get('PAPERS_TABLE', f"{ENVIRONMENT}-question-paper-generator-papers")
USER_POOL_ID = os.environ.get('USER_POOL_ID', '')
USER_POOL_CLIENT_ID = os.environ.get('USER_POOL_CLIENT_ID', '')

# DynamoDB table
papers_table = dynamodb.Table(PAPERS_TABLE)

# Authentication dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    payload = validate_jwt(token, USER_POOL_ID)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    return payload


@app.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    Authenticate a user and return JWT tokens
    """
    try:
        token_response = get_cognito_tokens(
            username=request.username,
            password=request.password,
            user_pool_id=USER_POOL_ID,
            client_id=USER_POOL_CLIENT_ID
        )
        
        return LoginResponse(
            access_token=token_response["AccessToken"],
            id_token=token_response["IdToken"],
            refresh_token=token_response["RefreshToken"],
            expires_in=token_response["ExpiresIn"]
        )
    
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@app.get("/subjects", response_model=List[Subject])
async def get_subjects(user: Dict = Depends(get_current_user)):
    """
    List all available subjects
    """
    try:
        subjects = list_s3_folders(QUESTION_BUCKET, "")
        
        return [
            Subject(
                id=subject,
                name=subject.replace("_", " ").title()
            )
            for subject in subjects
        ]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/topics", response_model=List[Topic])
async def get_topics(subject: str, user: Dict = Depends(get_current_user)):
    """
    List all topics for a given subject
    """
    try:
        topics = list_s3_folders(QUESTION_BUCKET, f"{subject}/")
        
        return [
            Topic(
                id=topic,
                name=topic.replace("_", " ").title(),
                subject_id=subject
            )
            for topic in topics
        ]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate", response_model=PaperGenerationResponse)
async def generate_paper(request: PaperGenerationRequest, user: Dict = Depends(get_current_user)):
    """
    Generate a custom question paper based on selected topics
    """
    try:
        # Generate unique ID for the paper
        paper_id = str(uuid.uuid4())
        user_id = user["sub"]
        
        # List of question PDFs to combine
        question_pdfs = []
        
        # Fetch question PDFs for each selected topic
        for topic_selection in request.topics:
            topic_questions = list_s3_files(
                QUESTION_BUCKET, 
                f"{request.subject}/{topic_selection.topic_id}/",
                ".pdf"
            )
            
            # Select random questions up to the requested count
            selected_questions = topic_questions[:topic_selection.question_count]
            
            for question in selected_questions:
                question_pdfs.append(f"{request.subject}/{topic_selection.topic_id}/{question}")
        
        # Combine PDFs
        output_pdf = combine_pdfs(
            s3_client=s3,
            bucket=QUESTION_BUCKET,
            file_keys=question_pdfs,
            output_key=f"{paper_id}.pdf",
            output_bucket=GENERATED_BUCKET,
            metadata={
                "userId": user_id,
                "subject": request.subject,
                "title": request.title,
                "durationMinutes": str(request.duration_minutes)
            }
        )
        
        # Store metadata in DynamoDB
        current_time = datetime.now().isoformat()
        
        papers_table.put_item(
            Item={
                "paperId": paper_id,
                "userId": user_id,
                "title": request.title,
                "subject": request.subject,
                "durationMinutes": request.duration_minutes,
                "topics": [t.dict() for t in request.topics],
                "createdAt": current_time,
                "s3Key": f"{paper_id}.pdf"
            }
        )
        
        # Generate presigned URL for the generated PDF
        download_url = create_presigned_url(
            s3_client=s3,
            bucket=GENERATED_BUCKET,
            key=f"{paper_id}.pdf",
            expiration=3600  # 1 hour
        )
        
        return PaperGenerationResponse(
            paper_id=paper_id,
            title=request.title,
            download_url=download_url,
            expires_in=3600
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/download/{paper_id}", response_model=DownloadResponse)
async def download_paper(paper_id: str, user: Dict = Depends(get_current_user)):
    """
    Get a presigned URL to download a previously generated paper
    """
    try:
        # Get paper metadata from DynamoDB
        response = papers_table.get_item(
            Key={"paperId": paper_id}
        )
        
        if "Item" not in response:
            raise HTTPException(status_code=404, detail="Paper not found")
        
        paper = response["Item"]
        
        # Check if the user owns this paper
        if paper["userId"] != user["sub"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Generate presigned URL
        download_url = create_presigned_url(
            s3_client=s3,
            bucket=GENERATED_BUCKET,
            key=paper["s3Key"],
            expiration=3600  # 1 hour
        )
        
        return DownloadResponse(
            paper_id=paper_id,
            title=paper["title"],
            download_url=download_url,
            expires_in=3600
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Lambda handler
handler = Mangum(app)

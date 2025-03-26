from typing import List, Optional
from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    """Request model for login endpoint"""
    username: str
    password: str


class LoginResponse(BaseModel):
    """Response model for login endpoint"""
    access_token: str
    id_token: str
    refresh_token: str
    expires_in: int


class Subject(BaseModel):
    """Model for a subject"""
    id: str
    name: str


class Topic(BaseModel):
    """Model for a topic within a subject"""
    id: str
    name: str
    subject_id: str


class TopicSelection(BaseModel):
    """Model for a selected topic with question count"""
    topic_id: str
    question_count: int = Field(..., gt=0)


class PaperGenerationRequest(BaseModel):
    """Request model for paper generation endpoint"""
    title: str
    subject: str
    topics: List[TopicSelection]
    duration_minutes: int = Field(..., gt=0)
    
    class Config:
        schema_extra = {
            "example": {
                "title": "Mathematics Midterm Exam",
                "subject": "mathematics",
                "topics": [
                    {"topic_id": "algebra", "question_count": 5},
                    {"topic_id": "geometry", "question_count": 3},
                    {"topic_id": "calculus", "question_count": 2}
                ],
                "duration_minutes": 120
            }
        }


class PaperGenerationResponse(BaseModel):
    """Response model for paper generation endpoint"""
    paper_id: str
    title: str
    download_url: str
    expires_in: int


class DownloadResponse(BaseModel):
    """Response model for download endpoint"""
    paper_id: str
    title: str
    download_url: str
    expires_in: int

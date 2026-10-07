from fastapi import APIRouter, Body
from typing import Dict, Any

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login")
def login(payload: Dict[str, Any] = Body(default={})):
    """
    Mock authentication for demo/presentation.
    Accepts any credentials and returns a valid session token.
    """
    username = payload.get("username") or payload.get("email") or "admin"
    return {
        "status": "success",
        "access_token": "recruitiq-demo-jwt-token-2026",
        "token_type": "bearer",
        "user": {
            "username": username,
            "role": "Lead Technical Recruiter",
            "organization": "RecruitIQ Enterprise"
        }
    }

@router.post("/token")
def token(payload: Dict[str, Any] = Body(default={})):
    return login(payload)

@router.get("/me")
def get_current_user():
    return {
        "username": "admin",
        "name": "Anirudh Saini",
        "role": "Lead Technical Recruiter",
        "permissions": ["all"]
    }

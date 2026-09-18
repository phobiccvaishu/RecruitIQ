from pydantic import BaseModel
from typing import List, Optional
import datetime

class CandidateSkillSchema(BaseModel):
    skill: str

    class Config:
        from_attributes = True

class CandidateResponse(BaseModel):
    id: int
    name: str
    email: Optional[str] = ""
    phone: Optional[str] = ""
    education: Optional[str] = ""
    experience: Optional[str] = ""
    projects: Optional[str] = ""
    certifications: Optional[str] = ""
    resume_filename: Optional[str] = ""
    resume_text: Optional[str] = ""
    github_url: Optional[str] = ""
    linkedin_url: Optional[str] = ""
    leetcode_url: Optional[str] = ""
    hackerrank_url: Optional[str] = ""
    created_at: datetime.datetime
    skills: List[CandidateSkillSchema]

    class Config:
        from_attributes = True

class CandidateUpdateSocial(BaseModel):
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    leetcode_url: Optional[str] = None
    hackerrank_url: Optional[str] = None


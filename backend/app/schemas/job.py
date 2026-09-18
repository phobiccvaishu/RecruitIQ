from pydantic import BaseModel
from typing import List, Optional
import datetime

class JobSkillSchema(BaseModel):
    skill: str
    skill_type: str  # 'required' or 'preferred'

    class Config:
        from_attributes = True

class JobCreate(BaseModel):
    job_title: str
    description: str
    experience_required: Optional[int] = 0
    raw_skills_text: Optional[str] = ""

class JobResponse(BaseModel):
    id: int
    job_title: str
    description: str
    experience_required: int
    created_at: datetime.datetime
    skills: List[JobSkillSchema]

    class Config:
        from_attributes = True

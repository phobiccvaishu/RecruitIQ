from pydantic import BaseModel
from typing import List, Optional

class ResumeParseResponse(BaseModel):
    name: str
    email: Optional[str] = ""
    phone: Optional[str] = ""
    education: Optional[str] = ""
    experience: Optional[str] = ""
    projects: Optional[str] = ""
    certifications: Optional[str] = ""
    skills: List[str]
    resume_filename: str
    resume_text: str

    class Config:
        from_attributes = True

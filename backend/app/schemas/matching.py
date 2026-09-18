from pydantic import BaseModel
from typing import List, Optional

class MatchRequest(BaseModel):
    candidate_id: int
    job_id: int
    semantic_w: Optional[float] = 0.60
    skill_w: Optional[float] = 0.25
    exp_w: Optional[float] = 0.10
    edu_w: Optional[float] = 0.05

class MatchResponse(BaseModel):
    candidate_id: int
    job_id: int
    candidate_name: str
    job_title: str
    overall_score: float
    semantic_score: float
    skill_score: float
    experience_score: float
    education_score: float
    keyword_baseline_score: float
    matching_skills: List[str]
    missing_skills: List[str]
    missing_required: List[str]
    missing_preferred: List[str]
    candidate_experience_years: int
    required_experience_years: int
    experience_match: bool
    embedding_method: str
    explanation: str
    fairness_notice: str
    interview_questions: Optional[List[str]] = []

    class Config:
        from_attributes = True

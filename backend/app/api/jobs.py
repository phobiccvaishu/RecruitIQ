from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.database.database import get_db
from app.database import models
from app.parsers.jd_parser import parse_job_description
from app.schemas.job import JobCreate, JobResponse

router = APIRouter(prefix="/jobs", tags=["jobs"])

class ParseJDRequest(BaseModel):
    title: str
    description: str

@router.post("/parse")
def parse_jd(payload: ParseJDRequest):
    """
    Parses a job description and extracts skills and experience requirements.
    """
    try:
        parsed = parse_job_description(payload.title, payload.description)
        return parsed
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to parse job description: {str(e)}")

@router.post("", response_model=JobResponse)
def create_job(payload: JobCreate, db: Session = Depends(get_db)):
    """
    Creates and stores a new job description, parsing it in the process.
    """
    try:
        parsed = parse_job_description(
            title=payload.job_title,
            description=payload.description,
            raw_skills_text=payload.raw_skills_text,
            min_exp=str(payload.experience_required) if payload.experience_required else ""
        )
        
        job = models.Job(
            job_title=parsed["job_title"],
            description=parsed["description"],
            experience_required=parsed["experience_required"]
        )
        db.add(job)
        db.flush()
        
        # Add skills
        for sk in parsed["skills"]:
            db_skill = models.JobSkill(
                job_id=job.id,
                skill=sk["skill"],
                skill_type=sk["skill_type"]
            )
            db.add(db_skill)
            
        db.commit()
        db.refresh(job)
        return job
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create job: {str(e)}")

@router.get("", response_model=List[JobResponse])
def get_jobs(db: Session = Depends(get_db)):
    """
    Gets all job listings.
    """
    return db.query(models.Job).all()

@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: int, db: Session = Depends(get_db)):
    """
    Gets a job description by ID.
    """
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    return job

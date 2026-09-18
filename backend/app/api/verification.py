from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, Any
from app.database.database import get_db
from app.database import models
from app.ml.verifier import run_full_verification, extract_social_handles

router = APIRouter(prefix="/verification", tags=["verification"])

@router.get("/{candidate_id}")
def verify_candidate_profile(candidate_id: int, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Runs full professional profile verification for a candidate.
    Extracts GitHub/LeetCode/HackerRank/LinkedIn handles from resume_text,
    verifies each platform, and returns a combined VerificationReport.
    """
    candidate = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    
    resume_text = candidate.resume_text or ""
    projects_text = candidate.projects or ""
    certifications_text = candidate.certifications or ""
    
    stored_handles = {
        "github": candidate.github_url,
        "linkedin": candidate.linkedin_url,
        "leetcode": candidate.leetcode_url,
        "hackerrank": candidate.hackerrank_url,
    }

    result = run_full_verification(resume_text, projects_text, certifications_text, override_handles=stored_handles)
    result["candidate_id"] = candidate_id
    result["candidate_name"] = candidate.name
    return result


@router.get("/handles/{candidate_id}")
def get_candidate_handles(candidate_id: int, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Just extracts and returns detected social handles from the candidate's resume.
    Quick check without running verification.
    """
    candidate = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    handles = extract_social_handles(candidate.resume_text or "")
    return {"candidate_id": candidate_id, "candidate_name": candidate.name, "handles": handles}

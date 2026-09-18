from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.database import get_db
from app.database import models
from app.schemas.candidate import CandidateResponse, CandidateUpdateSocial

router = APIRouter(prefix="/candidates", tags=["candidates"])

@router.get("", response_model=List[CandidateResponse])
def get_candidates(db: Session = Depends(get_db)):
    """
    Returns all candidates.
    """
    return db.query(models.Candidate).all()

@router.get("/{candidate_id}", response_model=CandidateResponse)
def get_candidate(candidate_id: int, db: Session = Depends(get_db)):
    """
    Returns a candidate profile by ID.
    """
    candidate = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    return candidate

@router.patch("/{candidate_id}/social", response_model=CandidateResponse)
def update_candidate_social(
    candidate_id: int,
    data: CandidateUpdateSocial,
    db: Session = Depends(get_db)
):
    """
    Updates LinkedIn, GitHub, LeetCode, and HackerRank profile URLs/handles for a candidate.
    """
    candidate = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    
    if data.linkedin_url is not None:
        candidate.linkedin_url = data.linkedin_url
    if data.github_url is not None:
        candidate.github_url = data.github_url
    if data.leetcode_url is not None:
        candidate.leetcode_url = data.leetcode_url
    if data.hackerrank_url is not None:
        candidate.hackerrank_url = data.hackerrank_url

    db.commit()
    db.refresh(candidate)
    return candidate

@router.post("/{candidate_id}/enrich")
def enrich_candidate(candidate_id: int, db: Session = Depends(get_db)):
    """
    Analyzes LinkedIn, GitHub, LeetCode, and HackerRank profiles to auto-extract 
    projects, coding languages, certifications, and skills into candidate profile.
    """
    from app.ml.enricher import enrich_candidate_profile
    res = enrich_candidate_profile(candidate_id, db)
    if res.get("status") == "error":
        raise HTTPException(status_code=404, detail=res.get("message"))
    return res



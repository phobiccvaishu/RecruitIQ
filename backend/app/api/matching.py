from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database import models
from app.ml.matching import calculate_match
from app.ml.train import predict_match_probability
from app.schemas.matching import MatchRequest, MatchResponse

router = APIRouter(prefix="/matching", tags=["matching"])

@router.post("/analyze", response_model=MatchResponse)
def analyze_match(payload: MatchRequest, db: Session = Depends(get_db)):
    """
    Computes a match between a candidate and a job, saves the result, and returns scores.
    """
    # 1. Fetch Candidate
    candidate = db.query(models.Candidate).filter(models.Candidate.id == payload.candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found.")
        
    # 2. Fetch Job
    job = db.query(models.Job).filter(models.Job.id == payload.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
        
    # 3. Format inputs for matching library
    candidate_dict = {
        "id": candidate.id,
        "name": candidate.name,
        "education": candidate.education or "",
        "experience": candidate.experience or "",
        "projects": candidate.projects or "",
        "certifications": candidate.certifications or "",
        "skills": [s.skill for s in candidate.skills]
    }
    
    job_dict = {
        "id": job.id,
        "job_title": job.job_title,
        "description": job.description or "",
        "experience_required": job.experience_required,
        "skills": [{"skill": s.skill, "skill_type": s.skill_type} for s in job.skills]
    }
    
    # 4. Calculate Heuristics Match
    weights = {
        "semantic": payload.semantic_w if payload.semantic_w is not None else 0.60,
        "skill": payload.skill_w if payload.skill_w is not None else 0.25,
        "experience": payload.exp_w if payload.exp_w is not None else 0.10,
        "education": payload.edu_w if payload.edu_w is not None else 0.05,
    }
    res = calculate_match(candidate_dict, job_dict, weights=weights)
    
    # 5. Extract features for ML model and predict model-predicted overall probability
    # Prepare features
    features = {
        "semantic_similarity": res["semantic_score"] / 100.0,
        "skill_match_percentage": res["skill_score"] / 100.0,
        "experience_difference": res["candidate_experience_years"] - res["required_experience_years"],
        "education_match": 1 if ("Science" in (candidate.education or "") or "AI" in (candidate.education or "")) else 0,
        "certification_match": 1 if (candidate.certifications and len(candidate.certifications.strip()) > 0) else 0
    }
    
    # Predict probability of suitability using the trained ML model
    ml_prob = predict_match_probability(features)
    
    # Let's combine the heuristic overall score and ML probability
    # Overall score = Heuristic match (60%) + ML probability (40%)
    combined_score = (res["overall_score"] * 0.60) + (ml_prob * 100.0 * 0.40)
    res["overall_score"] = round(combined_score, 1)
    res["explanation"] += f" The machine learning classifier predicts a {round(ml_prob * 100, 1)}% suitability probability based on candidate features."
    
    # 6. Save or Update Match record in database
    db_match = db.query(models.Match).filter(
        models.Match.candidate_id == payload.candidate_id,
        models.Match.job_id == payload.job_id
    ).first()
    
    if db_match:
        db_match.semantic_score = res["semantic_score"]
        db_match.skill_score = res["skill_score"]
        db_match.overall_score = res["overall_score"]
    else:
        db_match = models.Match(
            candidate_id=payload.candidate_id,
            job_id=payload.job_id,
            semantic_score=res["semantic_score"],
            skill_score=res["skill_score"],
            overall_score=res["overall_score"]
        )
        db.add(db_match)
        
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to persist match scores: {str(e)}")
        
    return res

# Synonym mapping routes
from pydantic import BaseModel as SchemaBaseModel

class SynonymCreateSchema(SchemaBaseModel):
    skill: str
    synonym: str
    equivalence_ratio: float = 1.0

@router.get("/synonyms")
def get_synonyms(db: Session = Depends(get_db)):
    return db.query(models.SkillSynonym).all()

@router.post("/synonyms")
def create_synonym(payload: SynonymCreateSchema, db: Session = Depends(get_db)):
    dup = db.query(models.SkillSynonym).filter(
        models.SkillSynonym.skill.ilike(payload.skill),
        models.SkillSynonym.synonym.ilike(payload.synonym)
    ).first()
    if dup:
        dup.equivalence_ratio = payload.equivalence_ratio
        db.commit()
        db.refresh(dup)
        return dup
    
    db_syn = models.SkillSynonym(
        skill=payload.skill,
        synonym=payload.synonym,
        equivalence_ratio=payload.equivalence_ratio
    )
    db.add(db_syn)
    db.commit()
    db.refresh(db_syn)
    return db_syn

@router.delete("/synonyms/{syn_id}")
def delete_synonym(syn_id: int, db: Session = Depends(get_db)):
    syn = db.query(models.SkillSynonym).filter(models.SkillSynonym.id == syn_id).first()
    if not syn:
        raise HTTPException(status_code=404, detail="Synonym not found.")
    db.delete(syn)
    db.commit()
    return {"status": "success"}

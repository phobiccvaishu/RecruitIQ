import numpy as np
from typing import Dict, Any, List
from app.ml.matching import calculate_match

def run_fairness_audit() -> Dict[str, Any]:
    """
    Executes a fairness audit by creating pairs of candidates with identical 
    qualifications but different protected attributes, and checking score variance.
    """
    # Define a base qualified candidate
    base_candidate = {
        "id": 999,
        "name": "Audit Candidate",
        "skills": ["Python", "Machine Learning", "NLP", "SQL"],
        "experience": "Worked as a Data Scientist for 3 years. Experienced in Python programming, machine learning, and building NLP pipelines.",
        "experience_years": 3,
        "education": "B.Tech in Computer Science",
        "projects": "Developed a text classification application using scikit-learn.",
        "certifications": "AWS Certified Developer"
    }
    
    # Define a target job
    job = {
        "id": 1,
        "job_title": "Machine Learning Engineer",
        "description": "Looking for a Machine Learning Engineer with 2+ years of experience. Must know Python, Machine Learning, and NLP.",
        "experience_required": 2,
        "skills": [
            {"skill": "Python", "skill_type": "required"},
            {"skill": "Machine Learning", "skill_type": "required"},
            {"skill": "NLP", "skill_type": "required"},
            {"skill": "SQL", "skill_type": "required"},
            {"skill": "TensorFlow", "skill_type": "preferred"}
        ]
    }
    
    # Define protected variations
    genders = ["Male", "Female", "Non-binary"]
    races = ["Asian", "Black", "White", "Hispanic"]
    
    gender_results = []
    race_results = []
    
    # Audit Gender
    for gender in genders:
        # Simulate having gender in resume text (just to verify it's ignored)
        cand_gendered = base_candidate.copy()
        cand_gendered["resume_text"] = base_candidate["experience"] + f" [Gender: {gender}]"
        
        # Calculate match
        res = calculate_match(cand_gendered, job)
        gender_results.append({
            "gender": gender,
            "overall_score": res["overall_score"],
            "semantic_score": res["semantic_score"],
            "skill_score": res["skill_score"]
        })
        
    # Audit Race
    for race in races:
        cand_raced = base_candidate.copy()
        cand_raced["resume_text"] = base_candidate["experience"] + f" [Race/Ethnicity: {race}]"
        
        res = calculate_match(cand_raced, job)
        race_results.append({
            "race": race,
            "overall_score": res["overall_score"],
            "semantic_score": res["semantic_score"],
            "skill_score": res["skill_score"]
        })
        
    # Check variance
    gender_scores = [r["overall_score"] for r in gender_results]
    race_scores = [r["overall_score"] for r in race_results]
    
    gender_variance = float(np.var(gender_scores))
    race_variance = float(np.var(race_scores))
    
    passed = (gender_variance == 0.0) and (race_variance == 0.0)
    
    return {
        "status": "passed" if passed else "failed",
        "description": "Fairness audit verifying zero impact of protected attributes on candidate scores.",
        "gender_variance": gender_variance,
        "race_variance": race_variance,
        "gender_audit_details": gender_results,
        "race_audit_details": race_results,
        "protected_attributes_excluded": ["gender", "race", "ethnicity", "religion", "age"],
        "historical_context": (
            "RecruitIQ is designed to address historical bias risks (like the Amazon case) "
            "by completely isolating scoring inputs to skills, experience, projects, and education."
        )
    }

from typing import Dict, Any, List
from app.ml.embeddings import compute_similarity, get_embedding_method

def calculate_match(candidate: Dict[str, Any], job: Dict[str, Any], weights: Dict[str, float] = None) -> Dict[str, Any]:
    """
    Computes a multi-dimensional candidate-job match score.
    Excludes protected/demographic details entirely from the calculations.
    Uses the Review 3 configurable weights:
    - Semantic Similarity: 60% (default)
    - Skill Match: 25% (default)
    - Experience Match: 10% (default)
    - Education Match: 5% (default)
    """
    # Load weights
    default_weights = {"semantic": 0.60, "skill": 0.25, "experience": 0.10, "education": 0.05}
    if weights:
        # Merge passed weights with defaults
        default_weights.update(weights)
    weights = default_weights

    # 1. Semantic Similarity Match
    candidate_text = f"{candidate.get('experience', '')} {candidate.get('projects', '')} {candidate.get('education', '')}"
    job_text = job.get("description", "")
    
    semantic_similarity = compute_similarity(candidate_text, job_text)
    
    # 2. Skill Match with Synonym Mappings
    candidate_skills = set(candidate.get("skills", []))
    job_skills_list = job.get("skills", [])
    
    required_job_skills = {js["skill"] for js in job_skills_list if js.get("skill_type") == "required"}
    preferred_job_skills = {js["skill"] for js in job_skills_list if js.get("skill_type") == "preferred"}
    
    if not required_job_skills and job_skills_list:
        required_job_skills = {js["skill"] for js in job_skills_list}

    # Load synonym rules from SQLite
    synonyms = {}
    try:
        from app.database.database import SessionLocal
        from app.database.models import SkillSynonym
        db = SessionLocal()
        db_syns = db.query(SkillSynonym).all()
        for ds in db_syns:
            s_key = ds.skill.lower().strip()
            syn_key = ds.synonym.lower().strip()
            if s_key not in synonyms:
                synonyms[s_key] = []
            synonyms[s_key].append((syn_key, ds.equivalence_ratio))
        db.close()
    except Exception as e:
        pass

    candidate_skills_lower = {s.lower().strip() for s in candidate_skills}
    matching_skills = []
    missing_required = []
    missing_preferred = []
    
    skill_score_sum = 0.0
    
    # Evaluate required skills
    if required_job_skills:
        for rjs in required_job_skills:
            rjs_lower = rjs.lower().strip()
            if rjs_lower in candidate_skills_lower:
                skill_score_sum += 1.0
                matching_skills.append(rjs)
            else:
                # Check synonyms
                max_ratio = 0.0
                matched_syn = None
                
                # Direct check: job skill is mapped to candidate skill
                if rjs_lower in synonyms:
                    for syn_name, ratio in synonyms[rjs_lower]:
                        if syn_name in candidate_skills_lower:
                            if ratio > max_ratio:
                                max_ratio = ratio
                                matched_syn = syn_name
                # Reverse check: candidate skill is mapped to job skill
                for main_skill, syn_list in synonyms.items():
                    if main_skill in candidate_skills_lower:
                        for syn_name, ratio in syn_list:
                            if syn_name == rjs_lower:
                                if ratio > max_ratio:
                                    max_ratio = ratio
                                    matched_syn = main_skill
                                    
                if max_ratio > 0:
                    skill_score_sum += max_ratio
                    matching_skills.append(f"{rjs} (synonym: {matched_syn} @ {int(max_ratio*100)}%)")
                else:
                    missing_required.append(rjs)
        
        skill_score = skill_score_sum / len(required_job_skills)
    else:
        skill_score = 1.0

    # Evaluate preferred skills
    if preferred_job_skills:
        for pjs in preferred_job_skills:
            pjs_lower = pjs.lower().strip()
            if pjs_lower in candidate_skills_lower:
                matching_skills.append(pjs)
            else:
                max_ratio = 0.0
                matched_syn = None
                if pjs_lower in synonyms:
                    for syn_name, ratio in synonyms[pjs_lower]:
                        if syn_name in candidate_skills_lower:
                            if ratio > max_ratio:
                                max_ratio = ratio
                                matched_syn = syn_name
                for main_skill, syn_list in synonyms.items():
                    if main_skill in candidate_skills_lower:
                        for syn_name, ratio in syn_list:
                            if syn_name == pjs_lower:
                                if ratio > max_ratio:
                                    max_ratio = ratio
                                    matched_syn = main_skill
                if max_ratio > 0:
                    matching_skills.append(f"{pjs} (synonym: {matched_syn} @ {int(max_ratio*100)}%)")
                else:
                    missing_preferred.append(pjs)
        
    # 3. Experience Match
    experience_text = candidate.get("experience", "")
    import re
    candidate_years = 0
    exp_matches = re.findall(r'\b(\d+)\+?\s*(?:years?|yrs?)\b', experience_text, re.IGNORECASE)
    if exp_matches:
        try:
            candidate_years = max([int(m) for m in exp_matches if m.isdigit()])
        except ValueError:
            pass
            
    candidate_years = candidate.get("experience_years", candidate_years)
    required_years = job.get("experience_required", 0)
    exp_score = 100.0 if candidate_years >= required_years else (candidate_years / required_years * 100.0 if required_years > 0 else 100.0)
    
    # 4. Education Match
    education_text = candidate.get("education", "") or ""
    job_description_text = job.get("description", "") or ""
    
    degrees_list = ["ph.d", "phd", "m.tech", "mtech", "b.tech", "btech", "mca", "mba", "b.sc", "bsc", "b.e.", "b.e", "be", "bachelor", "master"]
    required_degrees = []
    for deg in degrees_list:
        if re.search(r'\b' + re.escape(deg) + r'\b', job_description_text, re.IGNORECASE):
            required_degrees.append(deg)
            
    candidate_degrees = []
    for deg in degrees_list:
        if re.search(r'\b' + re.escape(deg) + r'\b', education_text, re.IGNORECASE):
            candidate_degrees.append(deg)
            
    if not required_degrees:
        education_score = 100.0 if candidate_degrees else 50.0
    else:
        has_match = False
        for req in required_degrees:
            if req in candidate_degrees:
                has_match = True
                break
            if req.replace(".", "") in [c.replace(".", "") for c in candidate_degrees]:
                has_match = True
                break
        education_score = 100.0 if has_match else (50.0 if candidate_degrees else 0.0)

    # Convert components to percentages
    semantic_pct = round(semantic_similarity * 100, 1)
    skill_pct = round(skill_score * 100, 1)
    exp_pct = round(exp_score, 1)
    edu_pct = round(education_score, 1)

    # Weighted calculation
    overall_score = (
        (semantic_pct * weights["semantic"]) +
        (skill_pct * weights["skill"]) +
        (exp_pct * weights["experience"]) +
        (edu_pct * weights["education"])
    )
    overall_pct = round(overall_score, 1)
    
    # Explanation Generation
    exp_status = "matches or exceeds" if candidate_years >= required_years else "is below"
    explanation = (
        f"Candidate {candidate.get('name', 'Unknown')} has an overall match of {overall_pct}%. "
        f"They possess {len(matching_skills)} matching skills out of {len(job_skills_list)} defined in the job description. "
        f"Their experience level of {candidate_years} years {exp_status} the required {required_years} years. "
        f"Semantic matching of their profile text with the job description yields a {semantic_pct}% similarity score (computed using {get_embedding_method()}). "
        f"Their education match is rated at {edu_pct}% based on credentials found: '{education_text.strip()}'."
    )
    
    # 5. Keyword Baseline comparison
    keyword_baseline = calculate_keyword_baseline_match(candidate, job)
    
    # Compare semantic similarity vs keyword overlap to explain delta
    delta = semantic_pct - keyword_baseline
    delta_explanation = ""
    if delta > 15:
        delta_explanation = f" Semantic matching scores the candidate {round(delta, 1)}% higher than the keyword baseline, indicating they possess highly relevant contextual experience and projects that traditional keyword matching missed."
    elif delta < -15:
        delta_explanation = f" Traditional keyword matching scores the candidate higher by {round(-delta, 1)}% due to exact acronym/skill overlap, though semantic similarity shows a lower context alignment."
    else:
        delta_explanation = " Both keyword overlap and semantic contextual evaluations are closely aligned."

    explanation += delta_explanation
    
    # Generate 3 custom interview questions based on missing skills or matching skills
    interview_questions = []
    questions_bank = {
        "python": [
            "Explain the difference between deep copy and shallow copy in Python.",
            "How does Python's Global Interpreter Lock (GIL) impact multi-threaded CPU-bound programs?",
            "What are generators in Python, and how do they optimize memory usage?"
        ],
        "machine learning": [
            "How do you address overfitting in a Machine Learning model, and what regularization techniques do you prefer?",
            "Explain the trade-off between bias and variance.",
            "What is the difference between bagging and boosting algorithms?"
        ],
        "sql": [
            "What is the difference between a clustered and a non-clustered index in SQL?",
            "Explain how database transactions maintain ACID properties.",
            "Write a SQL query to find the second highest salary from an Employee table without using LIMIT."
        ],
        "fastapi": [
            "How does dependency injection work in FastAPI, and why is it beneficial?",
            "What is the role of Pydantic in FastAPI validation?",
            "Explain how asynchronous route handlers (`async def`) improve FastAPI request throughput."
        ],
        "docker": [
            "Describe how you would design a multi-stage Dockerfile to minimize image size.",
            "What is the difference between a Docker container and an image?",
            "Explain how Docker network modes (host vs bridge) operate."
        ],
        "react": [
            "What is the difference between the Virtual DOM and the real DOM in React?",
            "Explain the React component lifecycle hooks or useEffect dependency arrays.",
            "How does state hoisting work, and when would you use context API vs redux?"
        ]
    }
    
    generic_questions = [
        "Tell me about a challenging technical project you worked on and how you resolved the obstacles.",
        "How do you write unit tests for your code, and what test coverage metrics do you aim for?",
        "Describe your process for learning a new technology or programming framework on the fly."
    ]
    
    # 1. Pull from missing skills
    for ms in (missing_required + missing_preferred):
        key = ms.lower()
        if key in questions_bank and len(interview_questions) < 3:
            q_list = questions_bank[key]
            q = q_list[0] if q_list else ""
            if q and q not in interview_questions:
                interview_questions.append(q)
                
    # 2. Pull from matching skills
    for ms in matching_skills:
        key = ms.lower()
        if key in questions_bank and len(interview_questions) < 3:
            q_list = questions_bank[key]
            q = q_list[1] if len(q_list) > 1 else (q_list[0] if q_list else "")
            if q and q not in interview_questions:
                interview_questions.append(q)
                
    # 3. Pull from generic
    generic_idx = 0
    while len(interview_questions) < 3 and generic_idx < len(generic_questions):
        q = generic_questions[generic_idx]
        if q not in interview_questions:
            interview_questions.append(q)
        generic_idx += 1
    
    return {
        "candidate_id": candidate.get("id"),
        "job_id": job.get("id"),
        "candidate_name": candidate.get("name"),
        "job_title": job.get("job_title"),
        "overall_score": overall_pct,
        "semantic_score": semantic_pct,
        "skill_score": skill_pct,
        "experience_score": exp_pct,
        "education_score": edu_pct,
        "keyword_baseline_score": keyword_baseline,
        "matching_skills": matching_skills,
        "missing_skills": missing_required + missing_preferred,
        "missing_required": missing_required,
        "missing_preferred": missing_preferred,
        "candidate_experience_years": candidate_years,
        "required_experience_years": required_years,
        "experience_match": candidate_years >= required_years,
        "embedding_method": get_embedding_method(),
        "explanation": explanation,
        "fairness_notice": (
            "Protected demographic details (gender, race, age, etc.) have been strictly excluded from matching. "
            "RecruitIQ provides AI-assisted decision support; final hiring decisions remain with the human recruiter."
        ),
        "interview_questions": interview_questions
    }

def calculate_keyword_baseline_match(candidate: Dict[str, Any], job: Dict[str, Any]) -> float:
    """
    Computes a keyword matching baseline score (from 0 to 100).
    It compares overlap of candidate skills with job skills.
    """
    candidate_skills = set([s.lower() for s in candidate.get("skills", [])])
    job_skills_list = job.get("skills", [])
    job_skills = set([s["skill"].lower() for s in job_skills_list])
    
    if not job_skills:
        return 100.0
        
    overlap = candidate_skills.intersection(job_skills)
    return round((len(overlap) / len(job_skills)) * 100, 1)

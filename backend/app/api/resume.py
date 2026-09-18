import os
import shutil
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database import models
from app.parsers.resume_parser import parse_resume
from app.core.config import settings
from app.ml.verifier import extract_social_handles

router = APIRouter(prefix="/resume", tags=["resumes"])

# Allowed extensions
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

@router.post("/upload")
def upload_resume(
    file: UploadFile = File(...),
    linkedin_url: Optional[str] = Form(None),
    linkedin_text: Optional[str] = Form(None),
    github_url: Optional[str] = Form(None),
    leetcode_url: Optional[str] = Form(None),
    hackerrank_url: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Uploads, parses, and persists a resume candidate profile, including LinkedIn, GitHub, LeetCode, and HackerRank profiles.
    """
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file extension: {ext}. Upload PDF or DOCX."
        )
        
    # Save file to uploads folder
    file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
        
    # Parse resume
    try:
        profile = parse_resume(file_path)
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=422, detail=f"Failed to parse resume: {str(e)}")

    # Extract handles from text as fallback
    extracted_handles = extract_social_handles(profile.get("resume_text", ""))
    
    final_github = (github_url or "").strip() or extracted_handles.get("github")
    final_linkedin = (linkedin_url or "").strip() or extracted_handles.get("linkedin")
    final_leetcode = (leetcode_url or "").strip() or extracted_handles.get("leetcode")
    final_hackerrank = (hackerrank_url or "").strip() or extracted_handles.get("hackerrank")
        
    # Persist in DB
    try:
        candidate = None
        if profile.get("email"):
            candidate = db.query(models.Candidate).filter(models.Candidate.email == profile["email"]).first()
            
        if candidate:
            # Update existing candidate details
            candidate.name = profile["name"]
            candidate.phone = profile["phone"]
            candidate.education = profile["education"]
            candidate.experience = profile["experience"]
            candidate.projects = profile["projects"]
            candidate.certifications = profile["certifications"]
            candidate.resume_filename = profile["resume_filename"]
            candidate.resume_text = profile["resume_text"]
            candidate.github_url = final_github
            candidate.linkedin_url = final_linkedin
            candidate.leetcode_url = final_leetcode
            candidate.hackerrank_url = final_hackerrank
            
            # Clear old skills and insert new
            db.query(models.CandidateSkill).filter(models.CandidateSkill.candidate_id == candidate.id).delete()
        else:
            # Create new
            candidate = models.Candidate(
                name=profile["name"],
                email=profile["email"],
                phone=profile["phone"],
                education=profile["education"],
                experience=profile["experience"],
                projects=profile["projects"],
                certifications=profile["certifications"],
                resume_filename=profile["resume_filename"],
                resume_text=profile["resume_text"],
                github_url=final_github,
                linkedin_url=final_linkedin,
                leetcode_url=final_leetcode,
                hackerrank_url=final_hackerrank
            )
            db.add(candidate)
            db.flush()  # Populates candidate.id
            
        # Add skills
        for skill in profile["skills"]:
            db_skill = models.CandidateSkill(candidate_id=candidate.id, skill=skill)
            db.add(db_skill)
            
        db.commit()
        db.refresh(candidate)

        # Auto-analyze social profiles (GitHub repos, LeetCode stats, HackerRank badges)
        try:
            from app.ml.enricher import enrich_candidate_profile
            enrich_candidate_profile(candidate.id, db, linkedin_text_override=linkedin_text)
            db.refresh(candidate)
        except Exception as _e:
            pass
        
        # Format response
        return {
            "id": candidate.id,
            "name": candidate.name,
            "email": candidate.email,
            "phone": candidate.phone,
            "education": candidate.education,
            "experience": candidate.experience,
            "projects": candidate.projects,
            "certifications": candidate.certifications,
            "resume_filename": candidate.resume_filename,
            "github_url": candidate.github_url,
            "linkedin_url": candidate.linkedin_url,
            "leetcode_url": candidate.leetcode_url,
            "hackerrank_url": candidate.hackerrank_url,
            "skills": [s.skill for s in candidate.skills],
            "created_at": candidate.created_at
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database transaction failed: {str(e)}")

@router.post("/load-sample")
def load_sample_resume(filename: str, db: Session = Depends(get_db)):
    """
    Loads one of the pre-generated sample resumes from disk and parses it.
    """
    sample_path = os.path.join(os.path.dirname(settings.BASE_DIR), "sample_data", "resumes", filename)
    if not os.path.exists(sample_path):
        raise HTTPException(status_code=404, detail=f"Sample resume file not found: {filename}")
        
    try:
        profile = parse_resume(sample_path)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to parse sample resume: {str(e)}")

    extracted_handles = extract_social_handles(profile.get("resume_text", ""))
        
    try:
        candidate = None
        if profile.get("email"):
            candidate = db.query(models.Candidate).filter(models.Candidate.email == profile["email"]).first()
            
        if candidate:
            candidate.name = profile["name"]
            candidate.phone = profile["phone"]
            candidate.education = profile["education"]
            candidate.experience = profile["experience"]
            candidate.projects = profile["projects"]
            candidate.certifications = profile["certifications"]
            candidate.resume_filename = profile["resume_filename"]
            candidate.resume_text = profile["resume_text"]
            candidate.github_url = extracted_handles.get("github")
            candidate.linkedin_url = extracted_handles.get("linkedin")
            candidate.leetcode_url = extracted_handles.get("leetcode")
            candidate.hackerrank_url = extracted_handles.get("hackerrank")
            
            db.query(models.CandidateSkill).filter(models.CandidateSkill.candidate_id == candidate.id).delete()
        else:
            candidate = models.Candidate(
                name=profile["name"],
                email=profile["email"],
                phone=profile["phone"],
                education=profile["education"],
                experience=profile["experience"],
                projects=profile["projects"],
                certifications=profile["certifications"],
                resume_filename=profile["resume_filename"],
                resume_text=profile["resume_text"],
                github_url=extracted_handles.get("github"),
                linkedin_url=extracted_handles.get("linkedin"),
                leetcode_url=extracted_handles.get("leetcode"),
                hackerrank_url=extracted_handles.get("hackerrank")
            )
            db.add(candidate)
            db.flush()
            
        for skill in profile["skills"]:
            db_skill = models.CandidateSkill(candidate_id=candidate.id, skill=skill)
            db.add(db_skill)
            
        db.commit()
        db.refresh(candidate)
        
        return {
            "id": candidate.id,
            "name": candidate.name,
            "email": candidate.email,
            "phone": candidate.phone,
            "education": candidate.education,
            "experience": candidate.experience,
            "projects": candidate.projects,
            "certifications": candidate.certifications,
            "resume_filename": candidate.resume_filename,
            "github_url": candidate.github_url,
            "linkedin_url": candidate.linkedin_url,
            "leetcode_url": candidate.leetcode_url,
            "hackerrank_url": candidate.hackerrank_url,
            "skills": [s.skill for s in candidate.skills],
            "created_at": candidate.created_at
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database transaction failed: {str(e)}")


@router.post("/process-local-batch")
def process_local_batch(
    job_id: int, 
    semantic_w: float = 0.60, 
    skill_w: float = 0.25, 
    exp_w: float = 0.10, 
    edu_w: float = 0.05, 
    db: Session = Depends(get_db)
):
    """
    Processes the pre-seeded batch of 100 resumes, matches them against a job description,
    writes the Review 3 evaluation deliverables, and returns the comparative rankings.
    """
    import os
    import shutil
    import csv
    import json
    import time
    
    project_root = r"c:\Users\saini\Downloads\RecruitIQ"
    eval_dir = os.path.join(project_root, "data", "evaluation")
    batch_dir = os.path.join(eval_dir, "resume_batch_100")
    meta_csv = os.path.join(eval_dir, "resume_batch_100.csv")
    
    review3_dir = os.path.join(project_root, "evaluation", "review3")
    os.makedirs(review3_dir, exist_ok=True)
    
    weights = {
        "semantic": semantic_w,
        "skill": skill_w,
        "experience": exp_w,
        "education": edu_w
    }
    
    # Load target job
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail=f"Job ID {job_id} not found.")
        
    job_skills_list = [{"skill": js.skill, "skill_type": js.skill_type} for js in job.skills]
    job_dict = {
        "id": job.id,
        "job_title": job.job_title,
        "experience_required": job.experience_required,
        "description": job.description,
        "skills": job_skills_list
    }
    
    # Check metadata file
    if not os.path.exists(meta_csv):
        raise HTTPException(status_code=400, detail="Resume batch metadata not found. Run extraction script first.")
        
    resumes_to_process = []
    with open(meta_csv, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            resumes_to_process.append(row)
            
    total_resumes = len(resumes_to_process)
    successful_count = 0
    failed_count = 0
    total_start_time = time.time()
    
    results = []
    failed_resumes_log = []
    processing_log = []
    sample_candidate_profiles = []
    skill_gap_results = []
    
    for row in resumes_to_process:
        cand_idx = row["candidate_id"]
        filename = row["filename"]
        file_path = os.path.join(batch_dir, filename)
        
        single_start_time = time.time()
        
        # Check if candidate is cached in database
        candidate = db.query(models.Candidate).filter(models.Candidate.resume_filename == filename).first()
        cache_hit = False
        
        try:
            if candidate:
                cache_hit = True
                profile = {
                    "id": candidate.id,
                    "name": candidate.name,
                    "email": candidate.email,
                    "phone": candidate.phone,
                    "education": candidate.education,
                    "experience": candidate.experience,
                    "projects": candidate.projects,
                    "certifications": candidate.certifications,
                    "resume_filename": candidate.resume_filename,
                    "resume_text": candidate.resume_text,
                    "skills": [s.skill for s in candidate.skills]
                }
            else:
                # Parse resume from scratch
                if not os.path.exists(file_path):
                    raise FileNotFoundError(f"Resume file {filename} not found in evaluation batch.")
                    
                profile = parse_resume(file_path)
                
                # Create and insert candidate
                candidate = models.Candidate(
                    name=profile["name"] or f"Candidate {cand_idx}",
                    email=profile["email"],
                    phone=profile["phone"],
                    education=profile["education"],
                    experience=profile["experience"],
                    projects=profile["projects"],
                    certifications=profile["certifications"],
                    resume_filename=filename,
                    resume_text=profile["resume_text"]
                )
                db.add(candidate)
                db.flush()
                
                for sk in profile["skills"]:
                    db_skill = models.CandidateSkill(candidate_id=candidate.id, skill=sk)
                    db.add(db_skill)
                    
                db.commit()
                db.refresh(candidate)
                
                profile["id"] = candidate.id
                
            # Perform Matching Calculation
            from app.ml.matching import calculate_match
            match_res = calculate_match(profile, job_dict, weights=weights)
            
            # Add metadata candidate index reference
            match_res["candidate_id"] = cand_idx
            
            # Record processing time
            elapsed_ms = round((time.time() - single_start_time) * 1000, 2)
            
            results.append(match_res)
            successful_count += 1
            
            processing_log.append({
                "candidate_id": cand_idx,
                "filename": filename,
                "status": "success",
                "cache_hit": cache_hit,
                "duration_ms": elapsed_ms
            })
            
            if len(sample_candidate_profiles) < 5:
                sample_candidate_profiles.append(profile)
                
            skill_gap_results.append({
                "candidate_id": cand_idx,
                "candidate_name": profile["name"],
                "matched_skills": ",".join(match_res["matching_skills"]),
                "missing_skills": ",".join(match_res["missing_skills"]),
                "preferred_skills_matched": ",".join(match_res["matching_skills"]),
                "skill_coverage_pct": match_res["skill_score"]
            })
            
        except Exception as e:
            failed_count += 1
            elapsed_ms = round((time.time() - single_start_time) * 1000, 2)
            failed_resumes_log.append({
                "filename": filename,
                "error": str(e)
            })
            processing_log.append({
                "candidate_id": cand_idx,
                "filename": filename,
                "status": "failed",
                "cache_hit": False,
                "duration_ms": elapsed_ms
            })
            db.rollback()

    total_duration = round(time.time() - total_start_time, 2)
    
    # Sort results by overall score descending
    results.sort(key=lambda x: x["overall_score"], reverse=True)
    
    # Add rank index
    for idx, r in enumerate(results):
        r["rank"] = idx + 1
        
    # Write deliverables to evaluation/review3/
    try:
        shutil.copy(meta_csv, os.path.join(review3_dir, "batch_100_metadata.csv"))
    except:
        pass
        
    # candidate_results.csv
    cand_results_path = os.path.join(review3_dir, "candidate_results.csv")
    with open(cand_results_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(["candidate_id", "candidate_name", "overall_score", "semantic_score", "skill_score", "experience_score", "education_score", "keyword_baseline_score"])
        for r in results:
            writer.writerow([r["candidate_id"], r["candidate_name"], r["overall_score"], r["semantic_score"], r["skill_score"], r["experience_score"], r["education_score"], r["keyword_baseline_score"]])
            
    # ranking.csv
    ranking_path = os.path.join(review3_dir, "ranking.csv")
    with open(ranking_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(["rank", "candidate_id", "candidate_name", "overall_score", "skills_coverage", "experience_years", "explanation"])
        for r in results:
            writer.writerow([r["rank"], r["candidate_id"], r["candidate_name"], r["overall_score"], f"{len(r['matching_skills'])}/{len(r['matching_skills']) + len(r['missing_skills'])}", r["candidate_experience_years"], r["explanation"]])
            
    # processing_log.csv
    proc_log_path = os.path.join(review3_dir, "processing_log.csv")
    with open(proc_log_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(["candidate_id", "filename", "status", "cache_hit", "duration_ms"])
        for p in processing_log:
            writer.writerow([p["candidate_id"], p["filename"], p["status"], p["cache_hit"], p["duration_ms"]])
            
    # failed_resumes.csv
    failed_path = os.path.join(review3_dir, "failed_resumes.csv")
    with open(failed_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(["filename", "error_message"])
        for fl in failed_resumes_log:
            writer.writerow([fl["filename"], fl["error"]])
            
    # skill_gap_results.csv
    skills_gap_path = os.path.join(review3_dir, "skill_gap_results.csv")
    with open(skills_gap_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(["candidate_id", "candidate_name", "matched_skills", "missing_skills", "preferred_skills_matched", "skill_coverage_pct"])
        for s in skill_gap_results:
            writer.writerow([s["candidate_id"], s["candidate_name"], s["matched_skills"], s["missing_skills"], s["preferred_skills_matched"], s["skill_coverage_pct"]])
            
    # sample_candidate_profiles.json
    samples_path = os.path.join(review3_dir, "sample_candidate_profiles.json")
    with open(samples_path, 'w', encoding='utf-8') as f:
        json.dump(sample_candidate_profiles, f, indent=2)
        
    # Calculate metrics summary
    avg_semantic = round(sum(r["semantic_score"] for r in results) / len(results), 1) if results else 0
    avg_final = round(sum(r["overall_score"] for r in results) / len(results), 1) if results else 0
    highest = max(r["overall_score"] for r in results) if results else 0
    lowest = min(r["overall_score"] for r in results) if results else 0
    
    summary_data = {
        "total_resumes": total_resumes,
        "processed_count": successful_count,
        "failed_count": failed_count,
        "success_rate_pct": round((successful_count / total_resumes) * 100, 1) if total_resumes > 0 else 0,
        "avg_semantic_score": avg_semantic,
        "avg_final_score": avg_final,
        "highest_score": highest,
        "lowest_score": lowest,
        "total_processing_time_sec": total_duration,
        "average_processing_time_per_resume_ms": round((total_duration * 1000) / total_resumes, 2) if total_resumes > 0 else 0
    }
    
    # evaluation_summary.json
    summary_path = os.path.join(review3_dir, "evaluation_summary.json")
    with open(summary_path, 'w', encoding='utf-8') as f:
        json.dump(summary_data, f, indent=2)
        
    return {
        "summary": summary_data,
        "rankings": results,
        "failed_resumes": failed_resumes_log
    }

from pydantic import BaseModel

class ProfileImportRequest(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin_url: Optional[str] = None
    linkedin_text: Optional[str] = None
    github_url: Optional[str] = None
    leetcode_url: Optional[str] = None
    hackerrank_url: Optional[str] = None

@router.post("/import-profiles")
def import_from_profiles(data: ProfileImportRequest, db: Session = Depends(get_db)):
    """
    Directly generates a candidate profile by analyzing LinkedIn, GitHub, LeetCode, and HackerRank.
    No PDF/DOCX file required.
    """
    candidate = None
    if data.email:
        candidate = db.query(models.Candidate).filter(models.Candidate.email == data.email).first()

    if candidate:
        candidate.name = data.name or candidate.name
        candidate.phone = data.phone or candidate.phone
        candidate.linkedin_url = data.linkedin_url or candidate.linkedin_url
        candidate.github_url = data.github_url or candidate.github_url
        candidate.leetcode_url = data.leetcode_url or candidate.leetcode_url
        candidate.hackerrank_url = data.hackerrank_url or candidate.hackerrank_url
    else:
        candidate = models.Candidate(
            name=data.name or "Imported Candidate",
            email=data.email or "",
            phone=data.phone or "",
            education="Extracted from LinkedIn profile",
            experience="Auto-extracted from professional profiles",
            projects="",
            certifications="",
            resume_filename="profile_direct_import",
            resume_text=f"Candidate: {data.name}\nEmail: {data.email}\nLinkedIn: {data.linkedin_url}\nGitHub: {data.github_url}",
            linkedin_url=data.linkedin_url,
            github_url=data.github_url,
            leetcode_url=data.leetcode_url,
            hackerrank_url=data.hackerrank_url
        )
        db.add(candidate)
        db.flush()

    db.commit()
    db.refresh(candidate)

    # Run deep profile analyzer
    from app.ml.enricher import enrich_candidate_profile
    enrich_res = enrich_candidate_profile(candidate.id, db, linkedin_text_override=data.linkedin_text)
    db.refresh(candidate)

    return {
        "id": candidate.id,
        "name": candidate.name,
        "email": candidate.email,
        "phone": candidate.phone,
        "education": candidate.education,
        "experience": candidate.experience,
        "projects": candidate.projects,
        "certifications": candidate.certifications,
        "skills": [s.skill for s in candidate.skills],
        "github_url": candidate.github_url,
        "linkedin_url": candidate.linkedin_url,
        "leetcode_url": candidate.leetcode_url,
        "hackerrank_url": candidate.hackerrank_url,
        "enrichment_details": enrich_res,
        "created_at": candidate.created_at
    }



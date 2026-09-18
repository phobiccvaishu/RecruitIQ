import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from app.nlp.preprocessing import clean_text
from app.nlp.skill_extractor import extract_skills
from app.nlp.entity_extractor import extract_entities
from app.parsers.jd_parser import parse_job_description
from app.ml.matching import calculate_match
from app.fairness.fairness_tests import run_fairness_audit

def test_nlp_cleaning():
    print("Testing clean_text...")
    text = "Hello\tWorld!\n   This is   a test.   "
    cleaned = clean_text(text)
    assert cleaned == "Hello World! This is a test."
    print("[OK] NLP cleaning passed.")

def test_skill_extraction():
    print("Testing skill_extractor...")
    text = "Candidate has strong knowledge of Python, Django, PostgreSQL, and Machine Learning."
    skills = extract_skills(text)
    assert "Python" in skills
    assert "Django" in skills
    assert "PostgreSQL" in skills
    assert "Machine Learning" in skills
    print("[OK] Skill extraction passed.")

def test_entity_extraction():
    print("Testing entity_extractor...")
    resume = """
    Anirudh Saini
    Email: anirudh@example.com
    Phone: +1-555-123-4567
    
    Education
    B.Tech Computer Science
    
    Experience
    2 years experience building FastAPI web services.
    """
    entities = extract_entities(resume)
    assert "Anirudh Saini" in entities["name"]
    assert entities["email"] == "anirudh@example.com"
    assert "B.Tech" in entities["education"]
    print("[OK] Entity extraction passed.")

def test_jd_parsing():
    print("Testing jd_parser...")
    jd = "Looking for a Machine Learning Engineer with 2+ years of experience. Must know Python, Machine Learning, and NLP."
    parsed = parse_job_description("ML Engineer", jd)
    assert parsed["job_title"] == "ML Engineer"
    assert parsed["experience_required"] == 2
    skills = [s["skill"] for s in parsed["skills"]]
    assert "Python" in skills
    assert "Machine Learning" in skills
    assert "NLP" in skills
    print("[OK] Job description parsing passed.")

def test_matching():
    print("Testing matching_engine...")
    cand = {
        "name": "Jane Doe",
        "skills": ["Python", "SQL", "Machine Learning"],
        "experience": "Data scientist with 3 years experience. Experienced in python programming.",
        "experience_years": 3,
        "education": "M.Tech AI"
    }
    job = {
        "job_title": "Data Scientist",
        "description": "Seeking data scientist with Python, SQL, and Machine Learning. 2 years experience.",
        "experience_required": 2,
        "skills": [
            {"skill": "Python", "skill_type": "required"},
            {"skill": "SQL", "skill_type": "required"},
            {"skill": "Machine Learning", "skill_type": "required"},
            {"skill": "Docker", "skill_type": "preferred"}
        ]
    }
    res = calculate_match(cand, job)
    assert res["overall_score"] > 0.0
    assert "Python" in res["matching_skills"]
    assert "SQL" in res["matching_skills"]
    assert "Docker" in res["missing_skills"]
    print("[OK] Matching calculations passed.")

def test_fairness_audit():
    print("Testing fairness_audit...")
    res = run_fairness_audit()
    assert res["status"] == "passed"
    assert res["gender_variance"] == 0.0
    assert res["race_variance"] == 0.0
    print("[OK] Fairness audit passed.")

def main():
    print("=== STARTING RECRUITIQ INTEGRATION TESTS ===")
    test_nlp_cleaning()
    test_skill_extraction()
    test_entity_extraction()
    test_jd_parsing()
    test_matching()
    test_fairness_audit()
    print("=== ALL INTEGRATION TESTS PASSED SUCCESSFULLY ===")

if __name__ == "__main__":
    main()

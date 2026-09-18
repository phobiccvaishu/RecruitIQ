import os
import csv
import random
import numpy as np
import pandas as pd
from typing import List, Dict, Any

# Ensure target directories exist
os.makedirs("sample_data", exist_ok=True)

# Predefined datasets for synthesis
NAMES = [
    "Aarav Sharma", "Aditya Patel", "Ananya Iyer", "Arjun Reddy", "Diya Sen",
    "Ishaan Gupta", "Kavya Nair", "Rohan Verma", "Siddharth Rao", "Zara Khan",
    "John Doe", "Jane Smith", "Michael Johnson", "Emily Davis", "David Miller",
    "Sarah Wilson", "James Taylor", "Jessica Anderson", "Robert Thomas", "Linda Jackson",
    "Anirudh Saini", "Rajesh Kumar", "Priya Patel", "Amit Singh", "Sanjay Sharma",
    "Neha Gupta", "Vikram Rathore", "Divya Teja", "Karthik Raja", "Shreya Ghoshal",
    "Rahul Dravid", "Sachin Tendulkar", "Sunil Chhetri", "Abhinav Bindra", "Mary Kom",
    "P.V. Sindhu", "Sania Mirza", "Viswanathan Anand", "Pranab Mukherjee", "Pratibha Patil",
    "Kiran Bedi", "Sudha Murty", "Indra Nooyi", "Sundar Pichai", "Satya Nadella",
    "Aravind Adiga", "Arundhati Roy", "Vikram Seth", "Salman Rushdie", "Chetan Bhagat"
]

SKILLS_POOL = [
    "Python", "Java", "C++", "JavaScript", "React", "Node.js", "FastAPI", "Django",
    "SQL", "PostgreSQL", "MongoDB", "Machine Learning", "Deep Learning", "NLP",
    "Computer Vision", "TensorFlow", "PyTorch", "Scikit-learn", "Pandas", "NumPy",
    "Docker", "AWS", "Azure", "Git", "Power BI"
]

EDUCATION_POOL = [
    "B.Tech Computer Science", "B.Tech Information Technology", "B.Sc Computer Science",
    "M.Tech Artificial Intelligence", "MCA", "B.E. Computer Science", "B.Tech AI & Data Science"
]

CERTIFICATIONS_POOL = [
    "AWS Certified Solutions Architect", "Google Professional Data Engineer",
    "TensorFlow Developer Certificate", "Microsoft Azure AI Engineer Associate",
    "Scrum Master Certification (PSM I)", "NVIDIA Deep Learning Institute Certificate",
    "Oracle Certified Professional Java SE Developer"
]

JOB_ROLES = [
    {
        "title": "Machine Learning Engineer",
        "description": "We are looking for a Machine Learning Engineer to deploy high-performance ML models. You will work on NLP pipelines, data preprocessing, and model deployment using Python, FastAPI, TensorFlow, and PyTorch.",
        "required_skills": ["Python", "Machine Learning", "TensorFlow", "PyTorch", "Scikit-learn"],
        "preferred_skills": ["FastAPI", "Docker", "Git", "NLP"],
        "min_experience": 2
    },
    {
        "title": "Full Stack Developer",
        "description": "Seeking a Full Stack Developer experienced in React and Node.js. You will design and deploy scalable web apps, integrate databases (PostgreSQL/MongoDB), and support API developments.",
        "required_skills": ["JavaScript", "React", "Node.js", "SQL", "PostgreSQL"],
        "preferred_skills": ["TypeScript", "Docker", "Git", "FastAPI"],
        "min_experience": 3
    },
    {
        "title": "Data Analyst",
        "description": "Join us as a Data Analyst to transform complex data into actionable business intelligence. You will write SQL queries, design reports in Power BI, and perform statistical analyses in Python.",
        "required_skills": ["SQL", "Pandas", "NumPy", "Power BI", "Tableau"],
        "preferred_skills": ["Python", "Git", "PostgreSQL"],
        "min_experience": 1
    },
    {
        "title": "Cloud DevOps Engineer",
        "description": "Looking for a Cloud DevOps Engineer to design CI/CD pipelines, containerize backend deployments, and manage resources on AWS/Azure using Docker and Kubernetes.",
        "required_skills": ["Docker", "Kubernetes", "AWS", "Git", "Linux"],
        "preferred_skills": ["Python", "Azure", "PostgreSQL"],
        "min_experience": 4
    },
    {
        "title": "Backend Python Developer",
        "description": "Seeking a Backend Engineer specializing in Python. You will design robust REST APIs using FastAPI/Django and manage database integrations with PostgreSQL.",
        "required_skills": ["Python", "FastAPI", "Django", "SQL", "PostgreSQL"],
        "preferred_skills": ["Docker", "Git", "AWS", "MongoDB"],
        "min_experience": 2
    }
]

# Sensitive attributes (for fairness validation)
GENDERS = ["Male", "Female", "Non-binary"]
RACES = ["Asian", "Black", "White", "Hispanic"]

def generate_data(num_candidates=500, num_jobs=50) -> Dict[str, str]:
    """
    Generates synthetic candidate profiles and jobs, evaluates pairs, 
    and saves files in the sample_data/ directory.
    """
    print(f"Generating {num_candidates} candidates and {num_jobs} jobs...")
    
    # 1. Generate Jobs
    jobs = []
    for i in range(num_jobs):
        role_template = random.choice(JOB_ROLES)
        job_id = i + 1
        jobs.append({
            "job_id": job_id,
            "job_title": f"{role_template['title']} (Grade {random.choice(['I', 'II', 'Sr.'])})",
            "description": role_template["description"],
            "required_skills": ",".join(role_template["required_skills"]),
            "preferred_skills": ",".join(role_template["preferred_skills"]),
            "minimum_experience": random.randint(max(0, role_template["min_experience"] - 1), role_template["min_experience"] + 2)
        })
        
    # 2. Generate Candidates
    candidates = []
    for i in range(num_candidates):
        cand_id = i + 1
        name = random.choice(NAMES)
        # Prevent exact duplicate names by adding initial if needed
        if random.random() > 0.5:
            name += f" {chr(random.randint(65, 90))}."
            
        education = random.choice(EDUCATION_POOL)
        experience_years = random.randint(0, 8)
        
        # Pull skills based on experience
        num_skills = random.randint(3, 8)
        skills = random.sample(SKILLS_POOL, num_skills)
        
        # Add profile matching skills based on logical clusters
        if random.random() > 0.3:
            # Let's align their skills to a job type
            template = random.choice(JOB_ROLES)
            skills = list(set(skills + random.sample(template["required_skills"], min(len(template["required_skills"]), 3))))
            
        num_certs = random.randint(0, 2)
        certs = random.sample(CERTIFICATIONS_POOL, num_certs)
        
        # Resume text structure
        resume_text = f"""
        {name}
        Email: {name.lower().replace(' ', '.')}@example.com
        Phone: +1-555-{random.randint(100, 999)}-{random.randint(1000, 9999)}
        
        EDUCATION
        {education} - GPA: {round(random.uniform(3.0, 4.0), 2)}
        
        EXPERIENCE
        Software Professional ({experience_years} years experience)
        Worked on building scalable systems, data transformations, and model building.
        Implemented algorithms, automated testing pipelines, and deployed cloud apps.
        
        SKILLS
        {', '.join(skills)}
        
        PROJECTS
        Personal Portfolio project implementing key domain challenges using {', '.join(skills[:2])}.
        
        CERTIFICATIONS
        {', '.join(certs) if certs else "None"}
        """
        
        # Protected attributes (only for fairness validation audits, excluded from matching scores)
        gender = random.choice(GENDERS)
        race = random.choice(RACES)
        
        candidates.append({
            "candidate_id": cand_id,
            "name": name,
            "education": education,
            "skills": ",".join(skills),
            "experience_years": experience_years,
            "projects": f"Project deploying {skills[0]} applications.",
            "certifications": ",".join(certs),
            "resume_text": resume_text.strip(),
            "gender": gender,
            "race": race
        })
        
    # Write Candidates CSV
    cand_df = pd.DataFrame(candidates)
    cand_df.to_csv("sample_data/synthetic_candidates.csv", index=False)
    
    # Write Jobs CSV
    jobs_df = pd.DataFrame(jobs)
    jobs_df.to_csv("sample_data/synthetic_jobs.csv", index=False)
    
    # 3. Generate matches dataset (candidate-job pairs) for training
    print("Generating candidate-job pair features for training...")
    pairs = []
    
    # Generate random pairs (e.g. 5 candidates per job, plus some random pairs to reach 1000+)
    # Let's generate a total of 1500 pairs
    num_pairs = 1500
    seen_pairs = set()
    
    while len(pairs) < num_pairs:
        c = random.choice(candidates)
        j = random.choice(jobs)
        pair_key = (c["candidate_id"], j["job_id"])
        if pair_key in seen_pairs:
            continue
        seen_pairs.add(pair_key)
        
        # Feature calculations
        c_skills = set(c["skills"].split(","))
        j_req_skills = set(j["required_skills"].split(","))
        j_pref_skills = set(j["preferred_skills"].split(","))
        j_all_skills = j_req_skills.union(j_pref_skills)
        
        # Skill Match %
        matching_req = c_skills.intersection(j_req_skills)
        skill_match_percentage = len(matching_req) / len(j_req_skills) if j_req_skills else 1.0
        
        # Semantic Similarity mock-up (fast, heuristic-based similarity matching for generation)
        c_text = f"{c['skills']} {c['education']} {c['projects']}".lower()
        j_text = f"{j['job_title']} {j['description']} {j['required_skills']}".lower()
        
        # A simple TF-IDF character/word overlap heuristic for generating training features fast
        c_words = set(c_text.split())
        j_words = set(j_text.split())
        overlap = len(c_words.intersection(j_words))
        semantic_similarity = overlap / len(j_words) if j_words else 0.0
        # Add random variance and normalize
        semantic_similarity = min(0.95, max(0.1, semantic_similarity + random.uniform(0.1, 0.4)))
        
        # Experience difference
        experience_difference = c["experience_years"] - j["minimum_experience"]
        
        # Education match (1 if candidate's education has "AI" or "Science" and job is AI/ML)
        education_match = 0
        if "Machine Learning" in j["job_title"] or "AI" in j["job_title"]:
            if "AI" in c["education"] or "Science" in c["education"]:
                education_match = 1
        else:
            education_match = 1 if "Science" in c["education"] or "MCA" in c["education"] else 0
            
        # Certifications Match (number of certs matching the cloud provider)
        cert_match = 0
        c_certs = c["certifications"]
        if "AWS" in j["job_title"] or "DevOps" in j["job_title"]:
            if "AWS" in c_certs:
                cert_match = 1
        elif "Azure" in j["job_title"] and "Azure" in c_certs:
            cert_match = 1
            
        # Overall Heuristic score to determine Match Label
        # Match label = 1 if match is good, 0 otherwise
        score = (semantic_similarity * 0.4) + (skill_match_percentage * 0.4) + ((1.0 if experience_difference >= 0 else 0.5) * 0.2)
        match_label = 1 if score >= 0.65 else 0
        
        pairs.append({
            "candidate_id": c["candidate_id"],
            "job_id": j["job_id"],
            "semantic_similarity": round(semantic_similarity, 3),
            "skill_match_percentage": round(skill_match_percentage, 3),
            "experience_difference": experience_difference,
            "education_match": education_match,
            "certification_match": cert_match,
            # Protected demographic attributes (to verify zero feature correlation)
            "gender": c["gender"],
            "race": c["race"],
            "match_label": match_label
        })
        
    pairs_df = pd.DataFrame(pairs)
    pairs_df.to_csv("sample_data/synthetic_matches.csv", index=False)
    pairs_df.to_csv("sample_data/training_dataset.csv", index=False)
    
    print("Synthetic data generated successfully.")
    return {
        "candidates_csv": "sample_data/synthetic_candidates.csv",
        "jobs_csv": "sample_data/synthetic_jobs.csv",
        "matches_csv": "sample_data/synthetic_matches.csv",
        "training_csv": "sample_data/training_dataset.csv"
    }

if __name__ == "__main__":
    generate_data()

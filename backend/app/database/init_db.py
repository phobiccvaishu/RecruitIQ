import sys
import os
# Adjust path to import app correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.database.database import engine, Base, SessionLocal
from app.database import models

def init_db():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if jobs already exist to avoid duplicates
        if db.query(models.Job).count() == 0:
            print("Seeding initial jobs...")
            
            # 1. ML Engineer
            ml_job = models.Job(
                job_title="Machine Learning Engineer",
                description="We are looking for a Machine Learning Engineer with strong Python and NLP knowledge. You will build and deploy statistical models and text classification systems.",
                experience_required=2
            )
            db.add(ml_job)
            db.flush()  # Get job ID
            
            ml_skills = [
                models.JobSkill(job_id=ml_job.id, skill="Python", skill_type="required"),
                models.JobSkill(job_id=ml_job.id, skill="Machine Learning", skill_type="required"),
                models.JobSkill(job_id=ml_job.id, skill="NLP", skill_type="required"),
                models.JobSkill(job_id=ml_job.id, skill="SQL", skill_type="required"),
                models.JobSkill(job_id=ml_job.id, skill="TensorFlow", skill_type="preferred")
            ]
            db.add_all(ml_skills)
            
            # 2. Full Stack Developer
            fs_job = models.Job(
                job_title="Full Stack Developer",
                description="We are looking for a Full Stack Developer experienced in React and Node.js. Experience with SQL and PostgreSQL databases is required for designing schemas.",
                experience_required=3
            )
            db.add(fs_job)
            db.flush()
            
            fs_skills = [
                models.JobSkill(job_id=fs_job.id, skill="JavaScript", skill_type="required"),
                models.JobSkill(job_id=fs_job.id, skill="React", skill_type="required"),
                models.JobSkill(job_id=fs_job.id, skill="Node.js", skill_type="required"),
                models.JobSkill(job_id=fs_job.id, skill="SQL", skill_type="required"),
                models.JobSkill(job_id=fs_job.id, skill="PostgreSQL", skill_type="required"),
                models.JobSkill(job_id=fs_job.id, skill="Git", skill_type="preferred")
            ]
            db.add_all(fs_skills)
            
            # 3. Data Analyst
            da_job = models.Job(
                job_title="Data Analyst",
                description="Looking for a Data Analyst to join our team to query databases and visualize insights using Python, SQL, and Power BI.",
                experience_required=1
            )
            db.add(da_job)
            db.flush()
            
            da_skills = [
                models.JobSkill(job_id=da_job.id, skill="SQL", skill_type="required"),
                models.JobSkill(job_id=da_job.id, skill="Python", skill_type="required"),
                models.JobSkill(job_id=da_job.id, skill="Power BI", skill_type="required"),
                models.JobSkill(job_id=da_job.id, skill="Tableau", skill_type="preferred")
            ]
            db.add_all(da_skills)
            
            # Seed default synonyms
            if db.query(models.SkillSynonym).count() == 0:
                print("Seeding initial skill synonyms...")
                default_syns = [
                    models.SkillSynonym(skill="React", synonym="Svelte", equivalence_ratio=0.8),
                    models.SkillSynonym(skill="Machine Learning", synonym="Deep Learning", equivalence_ratio=0.9),
                    models.SkillSynonym(skill="Python", synonym="Django", equivalence_ratio=0.8)
                ]
                db.add_all(default_syns)
            
            db.commit()
            print("Initial jobs seeded successfully.")
        else:
            print("Database already initialized and seeded.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()

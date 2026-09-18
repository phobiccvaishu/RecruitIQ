import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, index=True, nullable=True)
    phone = Column(String, nullable=True)
    education = Column(Text, nullable=True)  # Store structured info as JSON/text
    experience = Column(Text, nullable=True)  # Store structured info as JSON/text
    projects = Column(Text, nullable=True)
    certifications = Column(Text, nullable=True)
    resume_filename = Column(String, nullable=True)
    resume_text = Column(Text, nullable=True)
    # Social / professional profile links (Section 5.9)
    github_url = Column(String, nullable=True)
    linkedin_url = Column(String, nullable=True)
    leetcode_url = Column(String, nullable=True)
    hackerrank_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    skills = relationship("CandidateSkill", back_populates="candidate", cascade="all, delete-orphan")
    matches = relationship("Match", back_populates="candidate", cascade="all, delete-orphan")

class CandidateSkill(Base):
    __tablename__ = "candidate_skills"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"))
    skill = Column(String, index=True)

    # Relationships
    candidate = relationship("Candidate", back_populates="skills")

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    job_title = Column(String, index=True)
    description = Column(Text, nullable=True)
    experience_required = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    skills = relationship("JobSkill", back_populates="job", cascade="all, delete-orphan")
    matches = relationship("Match", back_populates="job", cascade="all, delete-orphan")

class JobSkill(Base):
    __tablename__ = "job_skills"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"))
    skill = Column(String, index=True)
    skill_type = Column(String, default="required")  # 'required' or 'preferred'

    # Relationships
    job = relationship("Job", back_populates="skills")

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"))
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"))
    semantic_score = Column(Float)
    skill_score = Column(Float)
    overall_score = Column(Float)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    candidate = relationship("Candidate", back_populates="matches")
    job = relationship("Job", back_populates="matches")

class SkillSynonym(Base):
    __tablename__ = "skill_synonyms"

    id = Column(Integer, primary_key=True, index=True)
    skill = Column(String, index=True)
    synonym = Column(String, index=True)
    equivalence_ratio = Column(Float, default=1.0)

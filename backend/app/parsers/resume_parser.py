import os
import logging
from typing import Dict, Any
from app.parsers.document_parser import parse_document
from app.nlp.preprocessing import clean_text
from app.nlp.skill_extractor import extract_skills
from app.nlp.entity_extractor import extract_entities

logger = logging.getLogger("resume_parser")

def parse_resume(file_path: str) -> Dict[str, Any]:
    """
    Parses a resume file and extracts structured information.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
        
    filename = os.path.basename(file_path)
    logger.info(f"Parsing resume: {filename}")
    
    # Step 1: Extract raw text
    raw_text = parse_document(file_path)
    
    # Step 2: Clean text
    cleaned_text = clean_text(raw_text)
    
    # Step 3: Extract contact details and sections
    profile = extract_entities(raw_text)
    
    # Step 4: Extract skills from text
    skills = extract_skills(cleaned_text)
    
    # Add metadata
    profile["skills"] = skills
    profile["resume_filename"] = filename
    profile["resume_text"] = raw_text
    
    return profile

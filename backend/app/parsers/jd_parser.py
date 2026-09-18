import re
from typing import Dict, Any, List
from app.nlp.skill_extractor import extract_skills

def extract_experience_required(text: str) -> int:
    """
    Parses job description text to find the minimum years of experience required.
    """
    if not text:
        return 0
        
    # Pattern for "3+ years", "3 years", "minimum of 3 years", "3 to 5 years"
    patterns = [
        r'\b(\d+)\+?\s*(?:years?|yrs?)\b',
        r'\b(?:minimum|min)\b\.?\s*(?:of)?\s*(\d+)\s*(?:years?|yrs?)',
        r'\b(\d+)\s*(?:to|-)\s*(?:\d+)\s*(?:years?|yrs?)'
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            # Get the minimum integer value found
            try:
                years = [int(m) for m in matches if m.isdigit()]
                if years:
                    return min(years)
            except ValueError:
                continue
                
    return 0

def parse_job_description(title: str, description: str, raw_skills_text: str = "", min_exp: str = "") -> Dict[str, Any]:
    """
    Parses recruiter input to return structured job data.
    """
    # Clean experience input
    experience_required = 0
    if min_exp:
        # Extract digits
        digit_match = re.search(r'\d+', min_exp)
        if digit_match:
            experience_required = int(digit_match.group(0))
    else:
        # Infer experience from description
        experience_required = extract_experience_required(description)
        
    # Extracted skills list
    all_skills = extract_skills(description)
    
    # If the user explicitly provided skills, add them
    if raw_skills_text:
        explicit_skills = [s.strip() for s in re.split(r'[,;\n]', raw_skills_text) if s.strip()]
        # Verify these are standard skills or normalize them
        for es in explicit_skills:
            norm_s = es.strip()
            if norm_s and norm_s not in all_skills:
                all_skills.append(norm_s)
                
    # Classify skills into required or preferred
    # Heuristic: Check if the skill appears near keywords like "preferred", "nice to have", "plus", "desirable"
    skills_list = []
    
    # We will search sentences
    sentences = re.split(r'[.!?\n]', description)
    preferred_keywords = re.compile(r'\b(?:preferred|nice to have|plus|desirable|optional|advantage)\b', re.IGNORECASE)
    
    preferred_skills_set = set()
    for sentence in sentences:
        if preferred_keywords.search(sentence):
            # Extract skills in this specific sentence
            sentence_skills = extract_skills(sentence)
            for s in sentence_skills:
                preferred_skills_set.add(s)
                
    for skill in all_skills:
        skill_type = "preferred" if skill in preferred_skills_set else "required"
        skills_list.append({
            "skill": skill,
            "skill_type": skill_type
        })
        
    return {
        "job_title": title.strip() or "Untitled Job",
        "description": description.strip(),
        "experience_required": experience_required,
        "skills": skills_list
    }

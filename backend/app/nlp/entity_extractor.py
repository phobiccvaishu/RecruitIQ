import re
from typing import Dict, Any, List

# Try importing spacy
try:
    import spacy
    # Load model (can be en_core_web_sm)
    try:
        nlp = spacy.load("en_core_web_sm")
    except OSError:
        # If model is not downloaded, we will download it or fall back
        nlp = None
except ImportError:
    nlp = None

# Regex patterns for contact information
EMAIL_REGEX = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
PHONE_REGEX = re.compile(r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b')

# Heuristics for sections
SECTION_PATTERNS = {
    "education": re.compile(r'\b(?:education|academic|qualifications|degree|university|college|school)\b', re.IGNORECASE),
    "experience": re.compile(r'\b(?:experience|employment|work history|professional history|career|work experience)\b', re.IGNORECASE),
    "projects": re.compile(r'\b(?:projects|key projects|academic projects|personal projects)\b', re.IGNORECASE),
    "certifications": re.compile(r'\b(?:certifications|licenses|credentials|courses|certifications & licenses)\b', re.IGNORECASE)
}

def extract_name(text: str) -> str:
    """
    Extracts name from resume text using spaCy NER or heuristic fallback.
    """
    if not text:
        return "Unknown Candidate"
        
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    if not lines:
        return "Unknown Candidate"
        
    if nlp:
        for line in lines[:3]:
            # Skip lines with obvious contact info before parsing
            if EMAIL_REGEX.search(line) or PHONE_REGEX.search(line) or "@" in line or "http" in line:
                continue
            doc = nlp(line)
            for ent in doc.ents:
                if ent.label_ == "PERSON":
                    name = ent.text.strip()
                    # Ensure name is alphabetic and contains at least 1-2 words
                    if len(name.split()) >= 1 and not re.search(r'[^a-zA-Z\s]', name):
                        return name
                    
    # Fallback heuristic: First line that is not a header, email, phone, or link
    for line in lines[:3]:
        # Skip if contains email or phone or url
        if EMAIL_REGEX.search(line) or PHONE_REGEX.search(line) or "http" in line or "@" in line:
            continue
        # Skip common headers
        if any(sec_pat.match(line) for sec_pat in SECTION_PATTERNS.values()):
            continue
        # Clean line
        cleaned = re.sub(r'[^a-zA-Z\s]', '', line).strip()
        if len(cleaned.split()) >= 1:
            return cleaned
            
    return lines[0] if lines else "Unknown Candidate"

def extract_email(text: str) -> str:
    match = EMAIL_REGEX.search(text)
    return match.group(0) if match else ""

def extract_phone(text: str) -> str:
    match = PHONE_REGEX.search(text)
    return match.group(0) if match else ""

def segment_sections(text: str) -> Dict[str, str]:
    """
    Splits text into sections based on keywords.
    """
    sections = {
        "education": "",
        "experience": "",
        "projects": "",
        "certifications": "",
        "other": ""
    }
    
    if not text:
        return sections
        
    lines = text.split('\n')
    current_section = "other"
    section_content = []
    
    for line in lines:
        line_clean = line.strip()
        if not line_clean:
            continue
            
        # Check if line looks like a header (short, capitalized or matches section pattern)
        is_header = False
        detected_section = None
        
        if len(line_clean) < 50:
            for sec_name, pattern in SECTION_PATTERNS.items():
                if pattern.match(line_clean):
                    is_header = True
                    detected_section = sec_name
                    break
                    
        if is_header and detected_section:
            # Save previous section
            if section_content:
                sections[current_section] = "\n".join(section_content).strip()
                section_content = []
            current_section = detected_section
        else:
            section_content.append(line)
            
    if section_content:
        sections[current_section] = "\n".join(section_content).strip()
        
    return sections

def extract_entities(text: str) -> Dict[str, Any]:
    """
    Orchestrates entity extraction, returning structured profile information.
    """
    name = extract_name(text)
    email = extract_email(text)
    phone = extract_phone(text)
    sections = segment_sections(text)
    
    return {
        "name": name,
        "email": email,
        "phone": phone,
        "education": sections["education"],
        "experience": sections["experience"],
        "projects": sections["projects"],
        "certifications": sections["certifications"]
    }

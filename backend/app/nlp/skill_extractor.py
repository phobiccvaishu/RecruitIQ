import re
from typing import List, Set

SKILL_MAP = {
    "python": "Python",
    "python 3": "Python",
    "python programming": "Python",
    "python developer": "Python",
    "java": "Java",
    "java programming": "Java",
    "c": "C",
    "c++": "C++",
    "cpp": "C++",
    "javascript": "JavaScript",
    "js": "JavaScript",
    "typescript": "TypeScript",
    "ts": "TypeScript",
    "react": "React",
    "reactjs": "React",
    "react.js": "React",
    "node.js": "Node.js",
    "nodejs": "Node.js",
    "node": "Node.js",
    "fastapi": "FastAPI",
    "django": "Django",
    "flask": "Flask",
    "sql": "SQL",
    "postgresql": "PostgreSQL",
    "postgres": "PostgreSQL",
    "mongodb": "MongoDB",
    "mongo": "MongoDB",
    "machine learning": "Machine Learning",
    "ml": "Machine Learning",
    "deep learning": "Deep Learning",
    "dl": "Deep Learning",
    "artificial intelligence": "Artificial Intelligence",
    "ai": "Artificial Intelligence",
    "nlp": "NLP",
    "natural language processing": "NLP",
    "computer vision": "Computer Vision",
    "cv": "Computer Vision",
    "tensorflow": "TensorFlow",
    "tf": "TensorFlow",
    "pytorch": "PyTorch",
    "scikit-learn": "Scikit-learn",
    "sklearn": "Scikit-learn",
    "pandas": "Pandas",
    "numpy": "NumPy",
    "docker": "Docker",
    "git": "Git",
    "github": "GitHub",
    "aws": "AWS",
    "amazon web services": "AWS",
    "azure": "Azure",
    "microsoft azure": "Azure",
    "power bi": "Power BI",
    "powerbi": "Power BI",
    "tableau": "Tableau",
    "html": "HTML",
    "css": "CSS",
    "spring boot": "Spring Boot",
    "springboot": "Spring Boot",
    "kubernetes": "Kubernetes",
    "k8s": "Kubernetes",
}

# Compile patterns dynamically
def compile_patterns():
    patterns = []
    for variant, canonical in SKILL_MAP.items():
        escaped = re.escape(variant)
        # Use word boundaries if it starts/ends with alphanumeric characters
        prefix = r'\b' if variant[0].isalnum() else ''
        suffix = r'\b' if variant[-1].isalnum() else ''
        pattern = re.compile(prefix + escaped + suffix, re.IGNORECASE)
        patterns.append((pattern, canonical))
    return patterns

SKILL_PATTERNS = compile_patterns()

def extract_skills(text: str) -> List[str]:
    """
    Extracts canonical skills from the text based on a predefined dictionary.
    """
    if not text:
        return []
    
    extracted = set()
    for pattern, canonical in SKILL_PATTERNS:
        if pattern.search(text):
            extracted.add(canonical)
            
    return sorted(list(extracted))

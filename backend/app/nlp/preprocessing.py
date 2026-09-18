import re

def clean_text(text: str) -> str:
    """
    Cleans raw text by removing extra whitespaces, normalizing newlines, 
    and preparing it for NLP tasks.
    """
    if not text:
        return ""
    # Normalize whitespaces and newlines
    text = re.sub(r'\s+', ' ', text)
    # Remove control characters
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\xff]', '', text)
    return text.strip()

def normalize_text_for_matching(text: str) -> str:
    """
    Normalizes text specifically for TF-IDF / similarity match.
    """
    cleaned = clean_text(text)
    return cleaned.lower()

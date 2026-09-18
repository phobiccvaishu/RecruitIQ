import logging
import numpy as np
from typing import List, Tuple, Any

logger = logging.getLogger("embeddings")

# Flags and cached models
model_method = "SentenceTransformer (all-MiniLM-L6-v2)"
transformer_model = None
initialized = False

def init_model():
    """
    Initializes the model lazily on demand to prevent blocking application startup.
    """
    global transformer_model, model_method, initialized
    if initialized:
        return
        
    import os
    os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
    
    try:
        from sentence_transformers import SentenceTransformer
        try:
            logger.info("Attempting to load SentenceTransformer all-MiniLM-L6-v2...")
            transformer_model = SentenceTransformer("all-MiniLM-L6-v2")
            model_method = "SentenceTransformer (all-MiniLM-L6-v2)"
            logger.info("Successfully loaded SentenceTransformer all-MiniLM-L6-v2.")
        except Exception as e:
            logger.warning(f"Failed to load sentence-transformers model. Falling back to TF-IDF. Error: {e}")
            model_method = "TF-IDF"
    except ImportError:
        logger.warning("sentence-transformers not installed. Falling back to TF-IDF.")
        model_method = "TF-IDF"
        
    initialized = True

def get_embedding_method() -> str:
    """
    Returns the current active embedding extraction method.
    """
    init_model()
    return model_method

def compute_similarity(text1: str, text2: str) -> float:
    """
    Computes cosine similarity between two texts.
    """
    if not text1 or not text2:
        return 0.0
        
    init_model()
    
    if model_method == "SentenceTransformer (all-MiniLM-L6-v2)" and transformer_model:
        try:
            embeddings = transformer_model.encode([text1, text2])
            vec1 = embeddings[0]
            vec2 = embeddings[1]
            dot_product = np.dot(vec1, vec2)
            norm_a = np.linalg.norm(vec1)
            norm_b = np.linalg.norm(vec2)
            if norm_a == 0.0 or norm_b == 0.0:
                return 0.0
            similarity = dot_product / (norm_a * norm_b)
            return float(max(0.0, min(1.0, similarity)))
        except Exception as e:
            logger.error(f"Error computing SentenceTransformer similarity: {e}. Falling back to TF-IDF.")
            
    # TF-IDF fallback
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        temp_vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = temp_vectorizer.fit_transform([text1, text2])
        arr = tfidf_matrix.toarray()
        vec1 = arr[0]
        vec2 = arr[1]
        norm_a = np.linalg.norm(vec1)
        norm_b = np.linalg.norm(vec2)
        if norm_a == 0.0 or norm_b == 0.0:
            return 0.0
        similarity = np.dot(vec1, vec2) / (norm_a * norm_b)
        return float(max(0.0, min(1.0, similarity)))
    except Exception as e:
        logger.error(f"Error computing TF-IDF similarity: {e}")
        return 0.0

import os

class Settings:
    PROJECT_NAME: str = "RecruitIQ"
    API_V1_STR: str = "/api"
    
    # Directories
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    PROJECT_ROOT: str = os.path.dirname(BASE_DIR)
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "uploads")
    
    # Database configuration (PostgreSQL default, falls back to absolute SQLite in project root)
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(PROJECT_ROOT, 'recruitiq.db')}")
    
    # Model configuration
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"

settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

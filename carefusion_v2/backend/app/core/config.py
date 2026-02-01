from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List, Optional

class Settings(BaseSettings):
    APP_NAME: str = "CareFusion AI Backend"
    DEBUG: bool = True
    
    # Auth
    SECRET_KEY: str = "default_secret" # Added default for safety if env missing
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # DB
    AUTH_MONGODB_URL: str = "mongodb://localhost:27017"
    AUTH_DB_NAME: str = "carefusion_auth"
    USERDATA_MONGODB_URL: str = "mongodb://localhost:27017"
    USERDATA_DB_NAME: str = "carefusion_users"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # Paths
    USER_DATA_ROOT: str = "C:/CareFusion-AI/data/users"
    AI_VENV_PATH: str = "C:/CareFusion-AI/carefusionEV"
    AI_PYTHON_EXECUTABLE: str = "C:/CareFusion-AI/carefusionEV/Scripts/python.exe"
    
    # AI Modules
    MODULE1_SCRIPT_PATH: str = "C:/CareFusion-AI/Reasoning_Sys/pipeline/Execution.py"
    MODULE2_SCRIPT_PATH: str = "C:/CareFusion-AI/Tuberculosis_Image_Classification/pipeline/run_module2.py"
    MODULE2_CHECKPOINT: str = "C:/CareFusion-AI/Tuberculosis_Image_Classification/experiments/runscam/classifier_retrain/best_combined.pth"
    MODULE3_SCRIPT_PATH: str = "C:/CareFusion-AI/dna_disease_identifier/run_module3.py"
    MODULE4_SCRIPT_PATH: str = "C:/CareFusion-AI/temporal_reasoning/temporal_analysis.py"
    MODULE_CHAT_SCRIPT_PATH: str = "C:/CareFusion-AI/Reasoning_Sys/pipeline/General_Chat.py"
    
    # Module Specific Python Exe (Optional)
    MODULE3_PYTHON_EXECUTABLE: Optional[str] = None
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["*"] # Allow all for tunneling ease

    class Config:
        env_file = ".env"
        extra = "ignore" 

@lru_cache()
def get_settings():
    return Settings()

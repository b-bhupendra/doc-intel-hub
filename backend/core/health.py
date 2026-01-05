# backend/core/health.py
import os
import requests
from backend.core.config import settings
from backend.core.logging import get_logger

logger = get_logger("HealthService")

def check_directories() -> bool:
    """Verifies that all required local data paths exist."""
    required_paths = ["./data/raw_pdfs", "./data/processed", settings.CHROMA_PERSIST_DIR]
    for path in required_paths:
        try:
            os.makedirs(path, exist_ok=True)
            logger.info(f"Directory ready: {path}")
        except Exception as e:
            logger.error(f"Failed to create directory {path}: {e}")
            return False
    return True

def check_ollama_status() -> bool:
    """Validates that the Ollama daemon is reachable and the required models exist."""
    try:
        url = f"{settings.OLLAMA_BASE_URL}/api/tags"
        response = requests.get(url, timeout=5)
        
        if response.status_code != 200:
            logger.error(f"Ollama returned HTTP status {response.status_code}")
            return False
            
        pulled_models = [m.get("name") for m in response.json().get("models", [])]
        logger.info(f"Connected to Ollama. Available models: {pulled_models}")
        
        # Check required generation and embedding models
        missing = []
        for model in [settings.GENERATION_MODEL, settings.EMBEDDING_MODEL]:
            # Accommodate variations with or without ':latest'
            base_name = model.split(":")[0]
            if not any(base_name in m for m in pulled_models):
                missing.append(model)
                
        if missing:
            logger.warning(f"Missing models: {missing}. Run: 'ollama pull <model_name>'")
            return False
            
        logger.info("All configured AI models are downloaded and ready.")
        return True
    except requests.exceptions.RequestException as e:
        logger.error(f"Could not connect to Ollama at {settings.OLLAMA_BASE_URL}: {e}")
        return False

def run_preflight_check() -> bool:
    logger.info(f"Initiating preflight check for: {settings.PROJECT_NAME}")
    dirs_ok = check_directories()
    ollama_ok = check_ollama_status()
    
    if dirs_ok and ollama_ok:
        logger.info(">>> SYSTEM STATUS: OPERATIONAL <<<")
        return True
    else:
        logger.warning(">>> SYSTEM STATUS: DEGRADED (Check errors above) <<<")
        return False

if __name__ == "__main__":
    run_preflight_check()
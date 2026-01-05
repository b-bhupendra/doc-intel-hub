# backend/core/logging.py
import logging
import sys
from backend.core.config import settings

def get_logger(name: str) -> logging.Logger:
    """Returns a standardized logger with timestamp and severity formatting."""
    logger = logging.getLogger(name)
    file_handler = logging.FileHandler('app.log') # Outputs to a file named app.log

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            fmt="%(asctime)s [%(levelname)s] [%(name)s]: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        file_handler = logging.FileHandler('app.log') # Outputs to a file named app.log
        file_handler.setFormatter(formatter)
        
        logger.addHandler(file_handler)
        if settings.ENVIRONMENT.lower() == "development":
            logger.setLevel(logging.DEBUG)
        else:
            logger.setLevel(logging.INFO)
            
    return logger


get_logger("Test logging").warning("Test warning")
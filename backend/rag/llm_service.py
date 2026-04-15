# backend/rag/llm_service.py
from abc import ABC, abstractmethod
import requests
from backend.core.config import settings
from backend.core.logging import get_logger

logger = get_logger("LLMFactory")


# 1. The Abstract Base Class (The Contract)
class BaseLLMService(ABC):
    @abstractmethod
    def generate_answer(self, system_prompt: str, context: str, query: str) -> str:
        pass


# 2. The Offline Implementation (Ollama)
class OllamaLLMService(BaseLLMService):
    def __init__(self):
        self.model = settings.OFFLINE_GENERATION_MODEL
        self.url = f"{settings.OLLAMA_BASE_URL}/api/generate"
        logger.info(f"Initialized Ollama LLM Service with model: {self.model}")

    def generate_answer(self, system_prompt: str, context: str, query: str) -> str:
        full_prompt = (
            f"{system_prompt}\n\n"
            f"Context:\n{context}\n\n"
            f"User Question: {query}\n"
            f"Answer:"
        )
        try:
            res = requests.post(
                self.url,
                json={
                    "model": self.model,
                    "prompt": full_prompt,
                    "stream": False,
                    "options": {"temperature": 0.0}
                },
                timeout=60
            )
            res.raise_for_status()
            return res.json().get("response", "").strip()
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to generate answer from Ollama LLM: {e}")
            raise


# 3. The Cloud Implementation (Groq)
class GroqLLMService(BaseLLMService):
    def __init__(self):
        from groq import Groq
        if not settings.GROQ_API_KEY:
            logger.warning("GROQ_API_KEY is not configured in .env; cloud LLM generation may fail.")
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.model = settings.CLOUD_GENERATION_MODEL
        logger.info(f"Initialized Cloud Groq LLM Service with model: {self.model}")

    def generate_answer(self, system_prompt: str, context: str, query: str) -> str:
        try:
            res = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {query}"}
                ],
                model=self.model,
                temperature=0.0,
            )
            return res.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Failed to generate answer from Groq LLM: {e}")
            raise


# 4. The Factory Router
def get_llm_service() -> BaseLLMService:
    """
    Factory router that dynamically provides the active LLM service based on AI_MODE.
    """
    if settings.AI_MODE == "cloud":
        logger.info("Factory Router: Initializing CLOUD LLM (Groq)")
        return GroqLLMService()
    else:
        logger.info("Factory Router: Initializing OFFLINE LLM (Ollama)")
        return OllamaLLMService()

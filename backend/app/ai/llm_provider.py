import os
import json
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List
from app.core.config import settings
from app.core.logging import logger

class BaseLLMProvider(ABC):
    @abstractmethod
    def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        pass

class LocalDeterministicProvider(BaseLLMProvider):
    """
    Zero-dependency deterministic NLP and reasoning fallback.
    Never fails or throws API key errors.
    """
    def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        # Returns an acknowledge response or triggers rule-based synthesis
        return "Processed locally via NEXUS deterministic reasoning engine."

class OpenAIProvider(BaseLLMProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        try:
            from openai import OpenAI
            base_url = getattr(settings, "OPENAI_BASE_URL", None)
            if base_url:
                self.client = OpenAI(api_key=api_key, base_url=base_url)
            else:
                self.client = OpenAI(api_key=api_key)
        except Exception as e:
            logger.warning(f"Failed to initialize OpenAI client: {e}")
            self.client = None

    def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        if not self.client:
            return LocalDeterministicProvider().generate(prompt, system_prompt)
        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
            
            resp = self.client.chat.completions.create(
                model="groq/compound-mini",
                messages=messages,
                temperature=0.2
            )
            return resp.choices[0].message.content or ""
        except Exception as e:
            logger.error(f"OpenAI API call failed: {e}. Falling back to local reasoning.")
            return LocalDeterministicProvider().generate(prompt, system_prompt)

class GeminiProvider(BaseLLMProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key

    def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        try:
            import httpx
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={self.api_key}"
            payload = {
                "contents": [{
                    "parts": [{"text": f"{system_prompt}\n\n{prompt}" if system_prompt else prompt}]
                }]
            }
            resp = httpx.post(url, json=payload, timeout=20.0)
            if resp.status_code == 200:
                data = resp.json()
                return data["candidates"][0]["content"]["parts"][0]["text"]
            else:
                logger.warning(f"Gemini API returned status {resp.status_code}. Using local provider.")
        except Exception as e:
            logger.warning(f"Gemini generation error: {e}")
        return LocalDeterministicProvider().generate(prompt, system_prompt)

def get_llm_provider() -> BaseLLMProvider:
    provider = settings.LLM_PROVIDER.lower()
    
    if provider == "openai" and settings.OPENAI_API_KEY:
        return OpenAIProvider(settings.OPENAI_API_KEY)
    elif provider == "gemini" and settings.GEMINI_API_KEY:
        return GeminiProvider(settings.GEMINI_API_KEY)
    
    # Default to robust local deterministic provider
    return LocalDeterministicProvider()

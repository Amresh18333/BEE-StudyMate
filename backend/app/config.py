from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    mongodb_uri: str
    database_name: str

    openrouter_api_key: str = ""
    gemini_api_key: str = ""
    nvidia_api_key: str = ""

    secret_key: str

    # ---- PDF summarizer model switch ----
    # SUMMARIZER_PROVIDER=NVIDIA        -> hosted NVIDIA API (default)
    # SUMMARIZER_PROVIDER=OLLAMA_QWEN   -> Qwen running locally in Ollama
    summarizer_provider: str = "NVIDIA"
    ollama_base_url: str = "http://localhost:11434/v1"
    ollama_model: str = "studymate-qwen"
    ollama_timeout_seconds: float = 900

    @field_validator("summarizer_provider")
    @classmethod
    def _check_provider(cls, value):
        value = (value or "NVIDIA").strip().upper()
        if value not in ("NVIDIA", "OLLAMA_QWEN"):
            raise ValueError(
                "SUMMARIZER_PROVIDER must be NVIDIA or OLLAMA_QWEN, got: " + value
            )
        return value

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    openai_api_key: str = ""
    chat_model: str = "gpt-4o-mini"
    embedding_model: str = "text-embedding-3-small"
    data_dir: str = "data"
    top_k: int = 6
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    rate_limit_requests: int = 30
    rate_limit_window: int = 3600
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def data_path(self) -> Path:
        return Path(__file__).resolve().parents[1] / self.data_dir


settings = Settings()

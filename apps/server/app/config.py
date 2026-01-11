from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    nibble_users: str = ""
    jwt_secret: str
    database_url: str
    cors_origins: str = ""

    class Config:
        env_file = Path(__file__).parent.parent / ".env"
        case_sensitive = False


settings = Settings()

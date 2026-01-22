from pydantic_settings import BaseSettings
from pathlib import Path
from pydantic import ConfigDict


class Settings(BaseSettings):
    nibble_users: str = ""
    jwt_secret: str
    database_url: str
    cors_origins: str = ""

    model_config = ConfigDict(env_file=Path(__file__).parent.parent / ".env", case_sensitive=False)  # type: ignore[typeddict-unknown-key,assignment]


settings = Settings()  # type: ignore[call-arg]

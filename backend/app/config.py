from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./fintrack.db"
    cors_origins: str = "http://localhost:3000"
    default_currency: str = "CAD"

    class Config:
        env_file = ".env"


settings = Settings()

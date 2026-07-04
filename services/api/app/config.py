from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./data/neuroloom.db"
    redis_url: str = "memory://"
    gemma_inference_url: str = "http://localhost:8080"
    fireworks_api_key: str = ""
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "neuroloom"
    minio_secret_key: str = "neuroloomsecret"
    cors_origins: str = "http://localhost:3000"
    web_app_url: str = "http://localhost:3000"
    secret_key: str = "neuroloom-dev-secret-change-in-production"

    class Config:
        env_file = ".env"


settings = Settings()

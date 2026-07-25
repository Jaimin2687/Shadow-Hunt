import os

class Settings:
    PORT: int = int(os.getenv("PORT", "8000"))
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    MODEL_RETRAIN_INTERVAL: int = int(os.getenv("MODEL_RETRAIN_INTERVAL", "3600"))

settings = Settings()

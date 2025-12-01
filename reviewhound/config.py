import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).parent.parent


class Config:
    # Database
    DATABASE_PATH = os.getenv("DATABASE_PATH", "data/reviews.db")

    # Scraping
    REQUEST_DELAY_MIN = float(os.getenv("REQUEST_DELAY_MIN", "2.0"))
    REQUEST_DELAY_MAX = float(os.getenv("REQUEST_DELAY_MAX", "4.0"))
    MAX_PAGES_PER_SOURCE = int(os.getenv("MAX_PAGES_PER_SOURCE", "3"))

    # Email Alerts
    SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM = os.getenv("SMTP_FROM", "alerts@example.com")

    # Web
    FLASK_SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "dev-key-change-in-production")
    FLASK_DEBUG = os.getenv("FLASK_DEBUG", "false").lower() == "true"

    # Scheduler
    SCRAPE_INTERVAL_HOURS = int(os.getenv("SCRAPE_INTERVAL_HOURS", "6"))

    @classmethod
    def get_database_url(cls) -> str:
        db_path = cls.DATABASE_PATH
        if not db_path.startswith(":"):
            db_path = str(BASE_DIR / db_path)
        return f"sqlite:///{db_path}"

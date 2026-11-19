
import os
from pathlib import Path
from dotenv import load_dotenv

# Backend directory
BASE_DIR = Path(__file__).resolve().parents[2]

# Load environment variables
ENV_FILE = BASE_DIR / ".env"
load_dotenv(ENV_FILE)

# Application settings
APP_NAME = "AGRI BREED AI"
APP_VERSION = "2.0.0"

# Database configuration
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "indian_livestock")

# Model configuration
MODEL_PATH = BASE_DIR / "model" / "Hack_ResNet50_model.pth"

# Image configuration
IMAGE_SIZE = 224

# CORS configuration
FRONTEND_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:3000,http://localhost:5173"
    ).split(",")
    if origin.strip()
]

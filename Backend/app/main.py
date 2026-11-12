
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import (
    APP_NAME,
    APP_VERSION,
    FRONTEND_ORIGINS
)

from app.database.connection import (
    initialize_connection_pool,
    check_database_connection
)

from app.services.prediction_service import load_model

from app.api.prediction import router as prediction_router
from app.api.analytics import router as analytics_router
from app.api.breeds import router as breeds_router


# --------------------------------------------------
# APPLICATION LIFECYCLE
# --------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):

    print("Starting AGRI BREED AI...")

    # Initialize MySQL
    initialize_connection_pool()
    print("MySQL connection pool initialized.")

    # Check database connection
    db_status = check_database_connection()

    if not db_status["connected"]:
        raise RuntimeError(
            f"Database connection failed: {db_status['error']}"
        )

    print(f"Connected to database: {db_status['database']}")

    # Load trained ResNet50 model
    load_model()

    print("AGRI BREED AI started successfully.")

    yield

    print("Shutting down AGRI BREED AI...")


# --------------------------------------------------
# FASTAPI APPLICATION
# --------------------------------------------------

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="AI-powered Cattle and Buffalo Breed Identification System",
    lifespan=lifespan
)


# --------------------------------------------------
# CORS CONFIGURATION
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"]
)


# --------------------------------------------------
# API ROUTERS
# --------------------------------------------------

app.include_router(prediction_router)
app.include_router(analytics_router)
app.include_router(breeds_router)


# --------------------------------------------------
# ROOT ENDPOINT
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "success": True,
        "message": "Welcome to AGRI BREED AI 2.0",
        "version": APP_VERSION
    }


# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.get("/health")
def health_check():

    db_status = check_database_connection()

    return {
        "application": APP_NAME,
        "status": "healthy" if db_status["connected"] else "degraded",
        "database": db_status
    }

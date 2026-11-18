
from fastapi import APIRouter, UploadFile, File, HTTPException
import mysql.connector

from app.database.connection import get_db_connection
from app.services.prediction_service import predict_image
from app.services.animal_validation import validate_animal

router = APIRouter(
    prefix="/predict",
    tags=["Breed Prediction"]
)


def get_complete_breed_info(breed_id: int, cursor):
    """Retrieve complete information about a breed."""

    tables = {
        "breed": "breeds",
        "economic_usage": "economic_usage",
        "physical_characteristics": "physical_characteristics",
        "production_data": "production_data",
        "reproduction_health": "reproduction_health"
    }

    result = {}

    for key, table in tables.items():
        cursor.execute(
            f"SELECT * FROM {table} WHERE breed_id = %s",
            (breed_id,)
        )
        result[key] = cursor.fetchone()

    return result if result["breed"] else None


@router.post("/")
async def predict(file: UploadFile = File(...)):
    """Identify cattle or buffalo breed from an uploaded image."""

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a valid image file."
        )

    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty."
        )

    # Limit upload size to 10 MB
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Image size must not exceed 10 MB."
        )

    connection = None
    cursor = None

    try:
        
        validation = validate_animal(image_bytes)

        if not validation["valid"]:
            raise HTTPException(
                status_code=400,
                detail="No cattle or buffalo detected. Please upload a clear cattle or buffalo image."
            )

        prediction = predict_image(image_bytes)

        breed_id = prediction["breed_id"]

        if breed_id is None:
            raise HTTPException(
                status_code=500,
                detail="Invalid predicted breed mapping."
            )

        # Retrieve breed information
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        complete_info = get_complete_breed_info(
            breed_id,
            cursor
        )

        if not complete_info:
            raise HTTPException(
                status_code=404,
                detail="Breed information not found."
            )

        # Save prediction for analytics
        cursor.execute(
            """
            INSERT INTO prediction_history
            (session_id, breed_id, confidence)
            VALUES (%s, %s, %s)
            """,
            (
                None,
                breed_id,
                prediction["confidence"]
            )
        )

        prediction_id = cursor.lastrowid

        connection.commit()

        return {
            "success": True,
            "prediction_id": prediction_id,
            "predicted_breed_index": prediction["predicted_index"],
            "breed_id": breed_id,
            "confidence": prediction["confidence"],
            "top5_predictions": prediction["top5_predictions"],
            "data": complete_info
        }

    except HTTPException:
        if connection and connection.is_connected():
            connection.rollback()
        raise

    except mysql.connector.Error as error:
        if connection and connection.is_connected():
            connection.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Database operation failed: {str(error)}"
        )

    except (ValueError, RuntimeError) as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:
        if connection and connection.is_connected():
            connection.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(error)}"
        )

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


from fastapi import APIRouter, HTTPException, Query
import mysql.connector

from app.database.connection import get_db_connection


router = APIRouter(
    prefix="/breeds",
    tags=["Breed Explorer"]
)


DETAIL_TABLES = [
    "economic_usage",
    "physical_characteristics",
    "production_data",
    "reproduction_health"
]


def get_breed_details(breed_id, cursor):
    """Retrieve complete information for a breed."""

    cursor.execute(
        "SELECT * FROM breeds WHERE breed_id = %s",
        (breed_id,)
    )

    breed = cursor.fetchone()

    if not breed:
        return None

    result = {"breed": breed}

    for table in DETAIL_TABLES:
        cursor.execute(
            f"SELECT * FROM {table} WHERE breed_id = %s",
            (breed_id,)
        )

        result[table] = cursor.fetchone()

    return result

@router.get("/")
def get_all_breeds(
    search: str | None = None,
    animal_type: str | None = None,
    category: str | None = None,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0)
):

    if animal_type and animal_type not in ["Cattle", "Buffalo"]:
        raise HTTPException(
            status_code=400,
            detail="Animal type must be Cattle or Buffalo."
        )

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        query = "SELECT * FROM breeds WHERE 1=1"
        params = []

        if search:
            query += " AND breed_name LIKE %s"
            params.append(f"%{search}%")

        if animal_type:
            query += " AND animal_type = %s"
            params.append(animal_type)

        if category:
            query += " AND breed_category = %s"
            params.append(category)

        query += " ORDER BY breed_name ASC LIMIT %s OFFSET %s"
        params.extend([limit, offset])

        cursor.execute(query, tuple(params))
        breeds = cursor.fetchall()

        return {
            "success": True,
            "count": len(breeds),
            "data": breeds
        }

    except mysql.connector.Error as error:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve breeds."
        ) from error

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()

@router.get("/compare")
def compare_breeds(
    breed_ids: list[int] = Query(
        ...,
        min_length=2,
        max_length=4
    )
):
    """Compare between two and four breeds."""

    if len(set(breed_ids)) != len(breed_ids):
        raise HTTPException(
            status_code=400,
            detail="Duplicate breed IDs are not allowed."
        )

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        comparison = []

        for breed_id in breed_ids:
            details = get_breed_details(
                breed_id,
                cursor
            )

            if not details:
                raise HTTPException(
                    status_code=404,
                    detail=f"Breed ID {breed_id} not found."
                )

            comparison.append(details)

        return {
            "success": True,
            "comparison_count": len(comparison),
            "data": comparison
        }

    except mysql.connector.Error as error:
        raise HTTPException(
            status_code=500,
            detail="Unable to compare breeds."
        ) from error

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


@router.get("/{breed_id}")
def get_breed(
    breed_id: int
):

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        result = get_breed_details(
            breed_id,
            cursor
        )

        if not result:
            raise HTTPException(
                status_code=404,
                detail="Breed not found."
            )

        return {
            "success": True,
            "data": result
        }

    except mysql.connector.Error as error:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve breed information."
        ) from error

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


from datetime import datetime, timedelta

import mysql.connector
from fastapi import APIRouter, HTTPException, Query

from app.database.connection import get_db_connection


router = APIRouter(
    prefix="/analytics",
    tags=["Analytics Dashboard"]
)


# --------------------------------------------------
# DATABASE HELPER
# --------------------------------------------------

def execute_query(query, params=None, fetch_all=True):
    """Execute a database query and return its results."""

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(query, params or ())

        if fetch_all:
            return cursor.fetchall()

        return cursor.fetchone()

    except mysql.connector.Error as error:
        raise HTTPException(
            status_code=500,
            detail="Analytics database query failed."
        ) from error

    finally:
        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()


# --------------------------------------------------
# 1. DASHBOARD SUMMARY
# --------------------------------------------------

@router.get("/summary")
def dashboard_summary():

    query = """
        SELECT
            (SELECT COUNT(*)
             FROM prediction_history) AS total_predictions,

            (SELECT COUNT(*)
             FROM breeds) AS total_breeds,

            (SELECT COUNT(*)
             FROM breeds
             WHERE animal_type = 'Cattle') AS cattle_breeds,

            (SELECT COUNT(*)
             FROM breeds
             WHERE animal_type = 'Buffalo') AS buffalo_breeds,

            (SELECT ROUND(AVG(confidence) * 100, 2)
             FROM prediction_history) AS average_confidence,

            (SELECT COUNT(*)
             FROM prediction_history
             WHERE DATE(created_at) = CURDATE()) AS predictions_today
    """

    result = execute_query(query, fetch_all=False)

    return {
        "success": True,
        "data": result
    }


# --------------------------------------------------
# 2. CATTLE VS BUFFALO DISTRIBUTION
# --------------------------------------------------

@router.get("/animal-distribution")
def animal_distribution():

    query = """
        SELECT
            b.animal_type,
            COUNT(p.prediction_id) AS total_predictions
        FROM breeds b
        LEFT JOIN prediction_history p
            ON b.breed_id = p.breed_id
        GROUP BY b.animal_type
        ORDER BY total_predictions DESC
    """

    result = execute_query(query)

    return {
        "success": True,
        "data": result
    }


# --------------------------------------------------
# 3. MOST FREQUENTLY PREDICTED BREEDS
# --------------------------------------------------

@router.get("/top-breeds")
def top_breeds(
    limit: int = Query(default=5, ge=1, le=20)
):

    query = """
        SELECT
            b.breed_id,
            b.breed_name,
            b.animal_type,
            COUNT(p.prediction_id) AS total_predictions,
            ROUND(AVG(p.confidence) * 100, 2)
                AS average_confidence
        FROM breeds b
        INNER JOIN prediction_history p
            ON b.breed_id = p.breed_id
        GROUP BY
            b.breed_id,
            b.breed_name,
            b.animal_type
        ORDER BY total_predictions DESC
        LIMIT %s
    """

    result = execute_query(query, (limit,))

    return {
        "success": True,
        "data": result
    }


# --------------------------------------------------
# 4. DAILY PREDICTION TRENDS
# --------------------------------------------------

@router.get("/prediction-trends")
def prediction_trends(
    days: int = Query(default=7, ge=1, le=365)
):

    start_date = datetime.now() - timedelta(days=days - 1)

    query = """
        SELECT
            DATE(created_at) AS prediction_date,
            COUNT(*) AS total_predictions
        FROM prediction_history
        WHERE created_at >= %s
        GROUP BY DATE(created_at)
        ORDER BY prediction_date ASC
    """

    result = execute_query(query, (start_date,))

    return {
        "success": True,
        "period_days": days,
        "data": result
    }


# --------------------------------------------------
# 5. RECENT PREDICTION HISTORY
# --------------------------------------------------

@router.get("/recent-predictions")
def recent_predictions(
    limit: int = Query(default=10, ge=1, le=100)
):

    query = """
        SELECT
            p.prediction_id,
            p.breed_id,
            b.breed_name,
            b.animal_type,
            p.confidence,
            ROUND(p.confidence * 100, 2)
                AS confidence_percentage,
            p.created_at
        FROM prediction_history p
        INNER JOIN breeds b
            ON p.breed_id = b.breed_id
        ORDER BY p.created_at DESC
        LIMIT %s
    """

    result = execute_query(query, (limit,))

    return {
        "success": True,
        "data": result
    }

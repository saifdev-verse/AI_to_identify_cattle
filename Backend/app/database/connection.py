
import mysql.connector
from mysql.connector import pooling

from app.core.config import (
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    DB_SSL_CA,
)

# Database connection pool
connection_pool = None


def initialize_connection_pool():
    """Initialize the MySQL/TiDB connection pool."""
    global connection_pool

    if connection_pool is None:

        connection_config = {
            "pool_name": "agri_breed_pool",
            "pool_size": 5,
            "pool_reset_session": True,
            "host": DB_HOST,
            "port": DB_PORT,
            "user": DB_USER,
            "password": DB_PASSWORD,
            "database": DB_NAME,
            "autocommit": False,
        }

        # Enable TLS certificate verification when configured
        if DB_SSL_CA:
            connection_config.update({
                "ssl_ca": DB_SSL_CA,
                "ssl_verify_cert": True,
                "ssl_verify_identity": True,
            })

        connection_pool = pooling.MySQLConnectionPool(
            **connection_config
        )

        print("Database connection pool initialized.")

    return connection_pool


def get_db_connection():
    """Get a connection from the pool."""

    if connection_pool is None:
        raise RuntimeError(
            "Database connection pool has not been initialized."
        )

    return connection_pool.get_connection()


def check_database_connection():
    """Check whether the database is accessible."""

    connection = None

    try:
        connection = get_db_connection()

        cursor = connection.cursor()
        cursor.execute("SELECT DATABASE()")
        result = cursor.fetchone()
        cursor.close()

        return {
            "connected": True,
            "database": result[0]
        }

    except mysql.connector.Error as error:
        return {
            "connected": False,
            "error": str(error)
        }

    finally:
        if connection and connection.is_connected():
            connection.close()

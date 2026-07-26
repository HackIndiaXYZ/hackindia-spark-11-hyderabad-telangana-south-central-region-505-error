from sqlalchemy import text
from database.database import engine

def test_connection():
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT version();"))
            row = result.fetchone()
            print("Successfully connected to Neon PostgreSQL!")
            print("PostgreSQL Version:", row[0])
    except Exception as e:
        print("Database connection error:", e)

if __name__ == "__main__":
    test_connection()

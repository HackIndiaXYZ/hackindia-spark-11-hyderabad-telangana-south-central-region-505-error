# Migration script: Add missing profile columns to the users table.
# Run once: venv/Scripts/python.exe database/add_user_columns.py
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database.database import engine


def migrate():
    print("Adding missing profile columns to users table...")
    columns = [
        ("phone",      "VARCHAR(50)"),
        ("department", "VARCHAR(100)"),
        ("job_title",  "VARCHAR(100)"),
        ("country",    "VARCHAR(100)"),
        ("timezone",   "VARCHAR(100)"),
        ("bio",        "VARCHAR(500)"),
        ("avatar_url", "VARCHAR(500)"),
    ]
    with engine.connect() as conn:
        for col_name, col_type in columns:
            sql = f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col_name} {col_type};"
            conn.execute(text(sql))
            print(f"  [OK] Ensured column: users.{col_name}")
        conn.commit()
    print("Migration completed successfully!")


if __name__ == "__main__":
    migrate()

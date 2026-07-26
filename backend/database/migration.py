import sys
import os
from sqlalchemy import text

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.database import engine

def migrate_db():
    print("Running DDL migration on Neon PostgreSQL...")
    with engine.connect() as conn:
        conn.execute(text("""
            ALTER TABLE audits ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'completed';
            ALTER TABLE audits ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 100;
            ALTER TABLE audits ADD COLUMN IF NOT EXISTS task_id VARCHAR(100);
        """))
        conn.commit()
    print("DDL Migration completed successfully!")

if __name__ == "__main__":
    migrate_db()

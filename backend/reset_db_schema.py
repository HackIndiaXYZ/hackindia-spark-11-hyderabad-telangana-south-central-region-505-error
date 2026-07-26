from database.database import engine
from database.models import Base

def reset_db():
    print("Dropping legacy tables and creating 10 Enterprise SaaS tables in Neon PostgreSQL...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("All 10 Enterprise SaaS tables created successfully!")

if __name__ == "__main__":
    reset_db()

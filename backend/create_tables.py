from database.database import engine
from database.models import Base

def init_db():
    print("Creating tables in Neon PostgreSQL...")
    Base.metadata.create_all(bind=engine)
    print("Database Connected & Tables Created Successfully!")

if __name__ == "__main__":
    init_db()

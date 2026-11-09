app_path = r"C:\Users\spait\Downloads\purechain-ai-app\apps\ai"
import sys
if app_path not in sys.path:
    sys.path.insert(0, app_path)

from infrastructure.database.connection import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    res = db.execute(text("""
        SELECT column_name, data_type, character_maximum_length 
        FROM information_schema.columns 
        WHERE table_schema = 'ai' AND table_name = 'market_price_observations' AND column_name = 'location'
    """)).fetchone()
    print(f"PostgreSQL column location: data_type={res[1]}, max_len={res[2]}")
finally:
    db.close()


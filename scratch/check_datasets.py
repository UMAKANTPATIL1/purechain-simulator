app_path = r"C:\Users\spait\Downloads\purechain-ai-app\apps\ai"
import sys
if app_path not in sys.path:
    sys.path.insert(0, app_path)

from infrastructure.database.connection import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    res = db.execute(text("SELECT dataset, count(*) FROM ai.market_price_observations GROUP BY dataset")).fetchall()
    print("Datasets in ai.market_price_observations:")
    for r in res:
        print(f"  {r[0]}: {r[1]}")
        
    p_recs = db.execute(text("SELECT commodity, count(*), min(observation_date), max(observation_date) FROM ai.market_price_observations WHERE dataset = 'MANDI_DAILY_PRICES' GROUP BY commodity")).fetchall()
    print("\nCommodities in MANDI_DAILY_PRICES:")
    for r in p_recs:
        print(f"  {r[0]}: count={r[1]}, date_range=({r[2]} to {r[3]})")
finally:
    db.close()


import subprocess

repo_dir = r"C:\Users\spait\Downloads\purechain-ai-app"
# Let's run a python script inside the purechain-ai-app environment to query the DB in READ-ONLY mode
script = """
from infrastructure.database.connection import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    total = db.execute(text("SELECT count(*) FROM ai.market_price_observations")).scalar()
    print(f"Total observations in ai.market_price_observations: {total}")
    
    agmarknet_count = db.execute(text("SELECT count(*) FROM ai.market_price_observations WHERE source = 'AGMARKNET'")).scalar()
    print(f"Total AGMARKNET observations: {agmarknet_count}")
    
    commodities = db.execute(text("SELECT commodity, count(*), min(observation_date), max(observation_date) FROM ai.market_price_observations GROUP BY commodity ORDER BY count(*) DESC")).fetchall()
    print("\nCommodities in ai.market_price_observations:")
    for row in commodities:
        print(f"  {row[0]}: count={row[1]}, date_range=({row[2]} to {row[3]})")
        
    # Check if there are any cotton records
    cotton_recs = db.execute(text("SELECT source, dataset, series, count(*) FROM ai.market_price_observations WHERE commodity = 'cotton' GROUP BY source, dataset, series")).fetchall()
    print(f"\nExisting cotton series in DB: {len(cotton_recs)}")
    for r in cotton_recs:
        print(f"  source={r[0]}, dataset={r[1]}, series={r[2]}, count={r[3]}")
finally:
    db.close()
"""

with open(r"C:\Users\spait\Downloads\purechain-ai-app\scratch_check_db.py", "w") as f:
    f.write(script)


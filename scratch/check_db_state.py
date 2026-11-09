import sys
import os

app_path = r"C:\Users\spait\Downloads\purechain-ai-app\apps\ai"
if app_path not in sys.path:
    sys.path.insert(0, app_path)

os.environ["PYTHONPATH"] = app_path

try:
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

        # Check existing cotton observations
        cotton_recs = db.execute(text("SELECT source, dataset, series, count(*) FROM ai.market_price_observations WHERE commodity = 'cotton' GROUP BY source, dataset, series")).fetchall()
        print(f"\nExisting cotton series in DB: {len(cotton_recs)}")
        for r in cotton_recs:
            print(f"  source={r[0]}, dataset={r[1]}, series={r[2]}, count={r[3]}")

        # Check existing tomato observations
        tomato_recs = db.execute(text("SELECT source, dataset, series, count(*) FROM ai.market_price_observations WHERE commodity = 'tomato' GROUP BY source, dataset, series")).fetchall()
        print(f"\nExisting tomato series in DB: {len(tomato_recs)}")
        for r in tomato_recs[:5]:
            print(f"  source={r[0]}, dataset={r[1]}, series={r[2]}, count={r[3]}")

    finally:
        db.close()
except Exception as e:
    print(f"DB check failed or skipped: {e}")


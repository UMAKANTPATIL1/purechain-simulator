with open(r"C:\Users\spait\Downloads\purechain-ai-app\apps\ai\agents\lekhak\services\data_aggregator.py", errors="ignore") as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if "AGMARKNET" in l or "market_price_observations" in l or "benchmark" in l.lower():
        if "def " in l or "class " in l:
            print(f"{i+1}: {l.strip()}")


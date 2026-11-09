with open(r"C:\Users\spait\Downloads\purechain-ai-app\apps\ai\agents\lekhak\services\data_aggregator.py", errors="ignore") as f:
    lines = f.readlines()

for i in range(550, 1275):
    l = lines[i]
    if "benchmark" in l.lower() or "agmarknet" in l.lower() or "market_price" in l.lower():
        print(f"{i+1}: {l.strip()[:100]}")


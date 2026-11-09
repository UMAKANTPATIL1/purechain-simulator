with open(r"C:\Users\spait\Downloads\purechain-ai-app\apps\ai\agents\lekhak\services\data_aggregator.py", errors="ignore") as f:
    lines = f.readlines()

for i in range(774, 945):
    print(f"{i+1}: {lines[i].rstrip()}")


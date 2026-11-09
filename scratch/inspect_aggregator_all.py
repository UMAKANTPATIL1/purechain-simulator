with open(r"C:\Users\spait\Downloads\purechain-ai-app\apps\ai\agents\lekhak\services\data_aggregator.py", errors="ignore") as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if l.startswith("def ") or l.startswith("class "):
        print(f"{i+1}: {l.strip()}")


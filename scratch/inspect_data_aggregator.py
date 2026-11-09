import re

with open(r"C:\Users\spait\Downloads\purechain-ai-app\apps\ai\agents\lekhak\services\data_aggregator.py", errors="ignore") as f:
    lines = f.readlines()

print(f"Total lines in data_aggregator.py: {len(lines)}")
for i, l in enumerate(lines):
    if "def resolve_benchmark(" in l or "class Benchmark" in l or "def _resolve_market_benchmark" in l or "benchmark" in l.lower() and "def " in l:
        print(f"{i+1}: {l.strip()}")


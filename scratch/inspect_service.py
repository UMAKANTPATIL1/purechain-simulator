import subprocess

repo_dir = r"C:\Users\spait\Downloads\purechain-ai-app"
content = subprocess.check_output(
    ["git", "-C", repo_dir, "show", "81745a6:apps/ai/domains/markets/agmarknet_service.py"],
    text=True, encoding="utf-8"
)

lines = content.splitlines()
print(f"Total lines in agmarknet_service.py: {len(lines)}")
print("--- Imports and class definition ---")
for i, l in enumerate(lines[:60]):
    print(l)

print("\n--- Methods in AgmarknetService ---")
for i, l in enumerate(lines):
    if l.strip().startswith("def "):
        print(f"{i+1}: {l}")


import subprocess

repo_dir = r"C:\Users\spait\Downloads\purechain-ai-app"
content = subprocess.check_output(
    ["git", "-C", repo_dir, "show", "81745a6:apps/ai/domains/markets/adapters/agmarknet.py"],
    text=True, encoding="utf-8"
)

for l in content.splitlines()[:60]:
    if "FLOOR" in l or "SUSPICIOUS" in l:
        print(l)


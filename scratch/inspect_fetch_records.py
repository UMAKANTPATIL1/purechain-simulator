import subprocess

repo_dir = r"C:\Users\spait\Downloads\purechain-ai-app"
content = subprocess.check_output(
    ["git", "-C", repo_dir, "show", "81745a6:apps/ai/domains/markets/adapters/agmarknet.py"],
    text=True, encoding="utf-8"
)

lines = content.splitlines()
in_func = False
for i, l in enumerate(lines):
    if "def fetch_records(" in l:
        in_func = True
    if in_func and i < 585:
        print(l)
    if in_func and "def normalize_record(" in l:
        break


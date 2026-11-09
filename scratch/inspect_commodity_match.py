import subprocess

repo_dir = r"C:\Users\spait\Downloads\purechain-ai-app"
content = subprocess.check_output(
    ["git", "-C", repo_dir, "show", "81745a6:apps/ai/domains/markets/adapters/agmarknet.py"],
    text=True, encoding="utf-8"
)

lines = content.splitlines()
in_func = False
for i, l in enumerate(lines):
    if "def match_canonical_commodity(" in l:
        in_func = True
    if in_func:
        print(l)
        if l.strip().startswith("def ") and not "match_canonical_commodity" in l:
            break


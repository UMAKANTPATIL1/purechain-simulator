import subprocess
import os

repo_dir = r"C:\Users\spait\Downloads\purechain-ai-app"

def git_show(path, commit="81745a6"):
    return subprocess.check_output(
        ["git", "-C", repo_dir, "show", f"{commit}:{path}"],
        text=True, encoding="utf-8"
    )

content = git_show("apps/ai/domains/markets/adapters/agmarknet.py")
lines = content.splitlines()

print("=== COMMODITY MAPPINGS IN agmarknet.py ===")
for i, l in enumerate(lines[:230]):
    if l.startswith('    "'):
        print(l)

print("\n=== COTTON DEFINITION IN agmarknet.py ===")
in_cotton = False
for l in lines:
    if '"cotton":' in l:
        in_cotton = True
    if in_cotton:
        print(l)
        if l.strip() == "},":
            break


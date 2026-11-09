import subprocess

repo_dir = r"C:\Users\spait\Downloads\purechain-ai-app"
content = subprocess.check_output(
    ["git", "-C", repo_dir, "show", "81745a6:apps/ai/domains/markets/adapters/agmarknet.py"],
    text=True, encoding="utf-8"
)

lines = content.splitlines()
for i, l in enumerate(lines[250:330]):
    print(f"{i+251}: {l}")


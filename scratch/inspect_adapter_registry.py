import os, re

repo_dir = r"C:\Users\spait\Downloads\purechain-ai-app"
pattern = re.compile(r"ADAPTER_REGISTRY|get_adapter")
for root, dirs, files in os.walk(os.path.join(repo_dir, "apps", "ai")):
    for f in files:
        if f.endswith(".py"):
            p = os.path.join(root, f)
            with open(p, errors="ignore") as fp:
                for idx, line in enumerate(fp):
                    if pattern.search(line):
                        print(f"{os.path.relpath(p, repo_dir)}:{idx+1}: {line.strip()[:90]}")


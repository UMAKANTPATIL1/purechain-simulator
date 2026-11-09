import subprocess

repo_dir = r"C:\Users\spait\Downloads\purechain-ai-app"
test_files = [
    "apps/ai/tests/unit/test_agmarknet_adapter.py",
    "apps/ai/tests/unit/test_agmarknet_adaptive_ingestion.py",
    "apps/ai/tests/unit/test_agmarknet_csv_importer.py",
    "apps/ai/tests/unit/test_agmarknet_daily_ingestion_and_freshness.py",
]

for tf in test_files:
    content = subprocess.check_output(
        ["git", "-C", repo_dir, "show", f"81745a6:{tf}"],
        text=True, encoding="utf-8"
    )
    print(f"=== {tf} ({len(content.splitlines())} lines) ===")
    for l in content.splitlines()[:25]:
        print(l)
    print()


import fitz
import sys

pdf_path = sys.argv[1] if len(sys.argv) > 1 else 'C:/Users/spait/.gemini/antigravity/brain/406dc091-4ddc-4d40-abe7-65b455d9917c/generated_t2_comparison.pdf'

doc = fitz.open(pdf_path)
print("TOTAL PDF PAGES:", len(doc))
assert len(doc) == 1, f"Expected 1 page, got {len(doc)}"

page = doc[0]
text = page.get_text()

assert "INR 1,000.00" in text, "PDF must contain INR 1,000.00"
assert "INR 16,53,000.00" in text, "PDF must contain INR 16,53,000.00"
assert "INR 33.06/kg" in text, "PDF must contain INR 33.06/kg"
assert "INR 75,000.00" not in text, "PDF MUST NOT contain INR 75,000.00"
assert "INR 17,27,000.00" not in text, "PDF MUST NOT contain INR 17,27,000.00"
assert "INR 34.54/kg" not in text, "PDF MUST NOT contain INR 34.54/kg"

print("  -> PDF TEXT FULLY VERIFIED (Zero stale 75,000 / 17,27,000 / 34.54 detected)!")


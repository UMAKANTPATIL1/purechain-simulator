
import fitz

doc = fitz.open(r"C:\Users\spait\.gemini\antigravity\brain\406dc091-4ddc-4d40-abe7-65b455d9917c\generated_t3_po.pdf")
page_count = len(doc)
print(f"=== BROWSER PRINT VERIFICATION RESULT ===")
print(f"Page Count: {page_count}")

assert page_count == 2, f"CRITICAL: Expected exactly 2 pages, got {page_count}"

# Page 1 checks
p1 = doc[0]
p1_text = p1.get_text()
print("\n--- PAGE 1 INSPECTION ---")
print("Rect:", p1.rect)
assert "TEMPLATE T-3" in p1_text, "Missing TEMPLATE T-3 on page 1"
assert "Work Order / Purchase Order (WO/PO)" in p1_text, "Missing Title on page 1"
assert "Order details" in p1_text, "Missing Order details on page 1"
assert "Amount (INR)" in p1_text, "Table header 'Amount (INR)' clipped on page 1"
assert "30,00,000.00" in p1_text, "Missing Base subtotal 30,00,000.00 on page 1"
assert "1,50,000.00" in p1_text, "Missing GST 1,50,000.00 on page 1"
assert "75,000.00" in p1_text, "Missing Freight 75,000.00 on page 1"
assert "32,25,000.00" in p1_text, "Missing Total 32,25,000.00 on page 1"
assert "Thirty-Two Lakh Twenty-Five Thousand" in p1_text, "Missing words Thirty-Two Lakh Twenty-Five Thousand on page 1"
assert "7 business days" in p1_text, "Missing Delivery: 7 business days on page 1"
assert "100% after delivery" in p1_text, "Missing Payment: 100% after delivery on page 1"
assert "Part A - Minimum Standard Conditions" in p1_text or "Part A — Minimum Standard Conditions" in p1_text, "Missing Part A header on page 1"
assert "1. Acceptance." in p1_text, "Missing Condition 1 on page 1"
assert "7. Compliance & origin data." in p1_text, "Missing Condition 7 on page 1"

# Page 2 checks
p2 = doc[1]
p2_text = p2.get_text()
print("\n--- PAGE 2 INSPECTION ---")
print("Rect:", p2.rect)
assert "TEMPLATE T-3" in p2_text.upper() and "CONTD" in p2_text.upper(), "Missing TEMPLATE T-3 (Contd.) on page 2"
assert "8. No assignment / subletting." in p2_text, "Missing Condition 8 on page 2"
assert "12. Entire agreement & precedence." in p2_text, "Missing Condition 12 on page 2"
assert "Part B - Special Conditions" in p2_text or "Part B — Special Conditions" in p2_text, "Missing Part B on page 2"
assert "For Buyer - Authorised Signatory & Seal" in p2_text, "Missing Buyer Signatory on page 2"
assert "Signed:" in p2_text, "Missing Signed: on page 2"
assert "Accepted - For Supplier (Signatory, Seal & Date)" in p2_text, "Missing Supplier Acceptance on page 2"
assert "Accepted:" in p2_text, "Missing Accepted: on page 2"
assert "Purechain note (T-3)" in p2_text, "Missing Purechain note (T-3) on page 2"

# Render high-resolution PNGs
pix1 = p1.get_pixmap(dpi=150)
pix1.save(r"C:/Users/spait/.gemini/antigravity/brain/406dc091-4ddc-4d40-abe7-65b455d9917c/generated_t3_po_page_1.png")
print("Page 1 PNG saved successfully.")

pix2 = p2.get_pixmap(dpi=150)
pix2.save(r"C:/Users/spait/.gemini/antigravity/brain/406dc091-4ddc-4d40-abe7-65b455d9917c/generated_t3_po_page_2.png")
print("Page 2 PNG saved successfully.")

print("\n>>> ALL BROWSER PRINT ASSERTIONS PASSED WITH 100% SUCCESS! <<<")

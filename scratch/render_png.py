
import fitz

doc = fitz.open(r"C:\Users\spait\.gemini\antigravity\brain\406dc091-4ddc-4d40-abe7-65b455d9917c\generated_corrected_rfq.pdf")
page = doc[0]
pix = page.get_pixmap(dpi=150)
out_png = r"C:/Users/spait/.gemini/antigravity/brain/406dc091-4ddc-4d40-abe7-65b455d9917c/corrected_rfq_page_1.png"
pix.save(out_png)
print("Saved page 1 PNG to:", out_png)

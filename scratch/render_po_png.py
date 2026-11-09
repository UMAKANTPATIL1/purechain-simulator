
import fitz

doc = fitz.open(r"C:\Users\spait\.gemini\antigravity\brain\406dc091-4ddc-4d40-abe7-65b455d9917c\generated_t3_po.pdf")
print("Page count:", len(doc))
for i in range(len(doc)):
    page = doc[i]
    pix = page.get_pixmap(dpi=150)
    out_png = rf"C:/Users/spait/.gemini/antigravity/brain/406dc091-4ddc-4d40-abe7-65b455d9917c/generated_t3_po_page_{i+1}.png"
    pix.save(out_png)
    print(f"Saved page {i+1} PNG to:", out_png)

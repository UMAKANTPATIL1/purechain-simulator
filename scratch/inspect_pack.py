import fitz

doc = fitz.open(r'C:/Users/spait/.gemini/antigravity/brain/406dc091-4ddc-4d40-abe7-65b455d9917c/.user_uploaded/media_1794128687878_b3a19585.pdf')
print('Num pages:', len(doc))
for idx, page in enumerate(doc):
    print(f'=== PAGE {idx+1} ===')
    text = page.get_text()
    first_lines = '\n'.join(text.splitlines()[:15])
    print(first_lines)

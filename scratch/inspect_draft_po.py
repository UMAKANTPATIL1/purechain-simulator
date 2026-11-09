import fitz

doc = fitz.open(r'C:\Users\spait\Downloads\Draft_PO_PO-2026-0007.pdf')
for i, page in enumerate(doc):
    print(f'*** PAGE {i+1} BLOCKS ***')
    print('Page rect:', page.rect)
    blocks = page.get_text('dict')['blocks']
    for b in blocks:
        if 'lines' in b:
            for line in b['lines']:
                for span in line['spans']:
                    if span['text'].strip():
                        print(f"font={span['font']}, size={span['size']:.1f}, color={hex(span['color'])}: {span['text'][:60]}")


const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

global.window = {};
global.document = {
  body: { classList: { add: () => { }, remove: () => { } } },
  querySelector: () => ({ classList: { add: () => { }, remove: () => { } }, style: {} }),
  querySelectorAll: () => [],
  getElementById: (id) => ({
    classList: { add: () => { }, remove: () => { } },
    style: {},
    innerHTML: '',
    appendChild: () => { },
    addEventListener: () => { }
  }),
  createElement: () => ({ style: {}, classList: { add: () => { } }, setAttribute: () => { } })
};

const PROCUREMENT_DATA = require('../js/data/procurement_data.js');
global.PROCUREMENT_DATA = PROCUREMENT_DATA;
window.PROCUREMENT_DATA = PROCUREMENT_DATA;
const DocumentModal = require('../js/ui/document_modal.js');

const modal = new DocumentModal();

// Initialize store and RFQ
PROCUREMENT_DATA.initStore();
const rfq = PROCUREMENT_DATA.createRFQ({
  rfq_ref: "PC-RFQ-2026-0113",
  material: "Onion",
  quantity: 50.0,
  unit: "MT",
  technical_specs: "Grade A Red Onion (45-60mm), Moisture < 14%, 50 kg mesh bags",
  delivery_location: "Hazira Works, Surat, Gujarat - 394510",
  terms_config: {
    term_1: "Per-unit rate with GST and freight separate; FOR destination",
    term_2: "Hazira Works, Surat, Gujarat - 394510",
    term_3: "100% after receipt and acceptance",
    term_5: "Certificate of Analysis (COA) and Test Report"
  }
});

// Create Purchase Order for UJJIVAN BANK
const po = PROCUREMENT_DATA.createPurchaseOrder({
  supplier_id: "supplier_2",
  supplier_name: "UJJIVAN SMALL FINANCE BANK LIMITED",
  supplier_location: "Dispur, Assam",
  quantity: 50.0,
  unit_price: 50000,
  unit_price_display: "INR 50,000.00/MT",
  base_amount: 2500000,
  freight_amount: 0,
  freight_display: "INR 0.00 (Included)",
  gst_rate: 18,
  gst_amount: 450000,
  total_landed_amount: 2950000,
  quotation_ref: "QT-2026-S2-8104",
  delivery_timeline: "2 days",
  payment_terms: "100% after receipt and acceptance",
  delivery_address: "Hazira Works, Surat, Gujarat - 394510",
  quality_docs: "Certificate of Analysis (COA) and Test Report"
});

const bodyHtml = modal.buildPoDocumentHtml(po);
const cssContent = fs.readFileSync(path.resolve(__dirname, '../css/presentation.css'), 'utf8');

const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Purchase Order T-3</title>
  <style>
    ${cssContent}
    body {
      background-color: #ffffff;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .t3-po-document {
      box-shadow: none !important;
      padding: 0 !important;
      max-width: 100% !important;
    }
    .report-actions {
      display: none !important;
    }
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;

const tempHtmlPath = path.resolve(__dirname, 'temp_po.html');
fs.writeFileSync(tempHtmlPath, fullHtml, 'utf8');

const outputPdfPath = path.resolve('C:/Users/spait/.gemini/antigravity/brain/406dc091-4ddc-4d40-abe7-65b455d9917c/generated_t3_po.pdf');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

console.log('Generating PDF via headless Chrome...');
const chromeCmd = `"${chromePath}" --headless=new --disable-gpu --print-to-pdf="${outputPdfPath}" --no-pdf-header-footer "file:///${tempHtmlPath.replace(/\\/g, '/')}"`;
execSync(chromeCmd, { stdio: 'inherit' });

console.log('PDF generated at:', outputPdfPath);

// Convert PDF first page to PNG
const pyScript = `
import fitz

doc = fitz.open(r"${outputPdfPath}")
print("Page count:", len(doc))
for i in range(len(doc)):
    page = doc[i]
    pix = page.get_pixmap(dpi=150)
    out_png = rf"C:/Users/spait/.gemini/antigravity/brain/406dc091-4ddc-4d40-abe7-65b455d9917c/generated_t3_po_page_{i+1}.png"
    pix.save(out_png)
    print(f"Saved page {i+1} PNG to:", out_png)
`;

const pyScriptPath = path.resolve(__dirname, 'render_po_png.py');
fs.writeFileSync(pyScriptPath, pyScript, 'utf8');

execSync(`python "${pyScriptPath}"`, { stdio: 'inherit' });
console.log('Done rendering PO PNGs.');


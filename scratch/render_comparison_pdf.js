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
  selected_suppliers: ["supplier_2", "supplier_3", "supplier_1"]
});

// Submit quote for Supplier 2 (UJJIVAN BANK): INR 60.00/kg, GST 18%, Freight INR 1,000
// -> Total landed: INR 35,41,000 -> Landed cost per unit: INR 70.82/kg
PROCUREMENT_DATA.submitQuotation("supplier_2", {
  quotation_ref: "QT-2026-S2-8104",
  revision: "Rev 0",
  unit_rate_val: 60.0,
  unit_rate_unit: "kg",
  unit_rate_display: "INR 60.00/kg",
  base_amount: 3000000,
  gst_rate: 18.0,
  gst_amount: 540000,
  freight_amount: 1000,
  freight_display: "INR 1,000.00",
  total_landed_amount: 3541000,
  delivery_period: "2 days",
  payment_terms: "payment after delivery",
  quotation_validity: "3 days",
  quality_docs: "No quality documents"
});

// Submit quote for Supplier 3 (Supplier Test): INR 28,000.00/MT, GST 18%, Freight INR 1,00,000 (INR 2,000/MT)
// -> Total landed: INR 17,52,000 -> Landed cost per unit: INR 35.04/kg
PROCUREMENT_DATA.submitQuotation("supplier_3", {
  quotation_ref: "QT-2026-S3-2917",
  revision: "Rev 0",
  unit_rate_val: 28000.0,
  unit_rate_unit: "MT",
  unit_rate_display: "INR 28,000.00/MT",
  base_amount: 1400000,
  gst_rate: 18.0,
  gst_amount: 252000,
  freight_amount: 100000,
  freight_display: "INR 1,00,000.00",
  total_landed_amount: 1752000,
  delivery_period: "2 days",
  payment_terms: "50% payment before delivery and 50% payment after delivery",
  quotation_validity: "3 days",
  quality_docs: "No quality documents"
});

// Supplier 1 remains pending to test submitted + pending mixed view matching the official reference PDF

const report = PROCUREMENT_DATA.generateComparativeStatement("PC-RFQ-2026-0113");
const bodyHtml = modal.buildComparisonDocumentHtml(report);

const cssPath = path.resolve(__dirname, '../css/presentation.css').replace(/\\/g, '/');

const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>T-2 Bid Comparison Report - ${report.comparison_ref}</title>
  <link rel="stylesheet" href="file:///${cssPath}">
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 14mm 12mm 14mm;
    }
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .t2-comparison-document {
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

const tempHtmlPath = path.resolve(__dirname, 'temp_comparison.html');
fs.writeFileSync(tempHtmlPath, fullHtml, 'utf8');

const outputPdfPath = path.resolve('C:/Users/spait/.gemini/antigravity/brain/406dc091-4ddc-4d40-abe7-65b455d9917c/generated_t2_comparison.pdf');
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
page = doc[0]
pix = page.get_pixmap(dpi=150)
out_png = r"C:/Users/spait/.gemini/antigravity/brain/406dc091-4ddc-4d40-abe7-65b455d9917c/generated_t2_comparison_page_1.png"
pix.save(out_png)
print("Saved page 1 PNG to:", out_png)
`;

const pyScriptPath = path.resolve(__dirname, 'render_comparison_png.py');
fs.writeFileSync(pyScriptPath, pyScript, 'utf8');

execSync(`python "${pyScriptPath}"`, { stdio: 'inherit' });
console.log('Done rendering PNG.');


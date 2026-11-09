const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

global.window = {};
global.document = {
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

const now = new Date();
const currentYear = now.getFullYear();
const rfqRef = `PC-RFQ-${currentYear}-0113`;

// Create sample RFQ with buyer-configured terms
const rfq = PROCUREMENT_DATA.createRFQ({
  rfq_ref: rfqRef,
  material: "Onion",
  quantity: 50.0,
  unit: "MT",
  quotation_deadline: "20 November 2026, 17:00 IST",
  terms_config: {
    term_1: "Per-unit rate, FOR Destination (GST & Freight separate)",
    term_2: "Plot 99, Dahej Industrial Estate, Bharuch, Gujarat - 392130",
    term_3: "25% advance, balance within 45 days of receipt & acceptance",
    term_4: "Active GSTIN mandatory, valid e-way bill with consignment",
    term_5: "Batch test report, Certificate of Analysis & FSSAI declaration",
    term_6: "Yes — Material origin declaration required",
    term_7: "Submit via WhatsApp or email to purchase@apexgreenmetals.com",
    term_8: "Buyer reserves the right to accept any quote in whole or in part, reject any or all quotes without assigning reasons, and split quantities across multiple suppliers."
  }
});

const bodyHtml = modal.buildRfqDocumentHtml(rfq);

const cssPath = path.resolve(__dirname, '../css/presentation.css').replace(/\\/g, '/');

const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>RFQ - ${rfq.rfq_ref}</title>
  <link rel="stylesheet" href="file:///${cssPath}">
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 18mm 15mm 18mm;
    }
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;

const tempHtmlPath = path.resolve(__dirname, 'temp_rfq.html');
fs.writeFileSync(tempHtmlPath, fullHtml, 'utf8');

const outputPdfPath = path.resolve('C:/Users/spait/.gemini/antigravity/brain/406dc091-4ddc-4d40-abe7-65b455d9917c/generated_corrected_rfq.pdf');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

console.log('Generating PDF via headless Chrome...');
const chromeCmd = `"${chromePath}" --headless=new --disable-gpu --print-to-pdf="${outputPdfPath}" --no-pdf-header-footer "file:///${tempHtmlPath.replace(/\\/g, '/')}"`;
execSync(chromeCmd, { stdio: 'inherit' });

console.log('PDF generated at:', outputPdfPath);

// Convert PDF first page to PNG
const pyScript = `
import fitz

doc = fitz.open(r"${outputPdfPath}")
page = doc[0]
pix = page.get_pixmap(dpi=150)
out_png = r"C:/Users/spait/.gemini/antigravity/brain/406dc091-4ddc-4d40-abe7-65b455d9917c/corrected_rfq_page_1.png"
pix.save(out_png)
print("Saved page 1 PNG to:", out_png)
`;

const pyScriptPath = path.resolve(__dirname, 'render_png.py');
fs.writeFileSync(pyScriptPath, pyScript, 'utf8');

execSync(`python "${pyScriptPath}"`, { stdio: 'inherit' });
console.log('Done rendering PNG.');


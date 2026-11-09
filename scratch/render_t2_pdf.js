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
const ProcurementEngine = require('../js/engines/procurement_engine.js');
const DocumentModal = require('../js/ui/document_modal.js');

const modal = new DocumentModal();
window.documentModal = modal;
const engine = new ProcurementEngine();

// 1. Initialize store & create standard 50 MT Onion RFQ
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
    term_3: "50% advance, 50% after delivery",
    term_5: "No quality documents"
  }
});

// 2. Supplier 3 (Supplier Test) submits quote: ₹28,000 per MT, 18% GST, ₹1,000 lump sum freight
engine.handleSupplierAction("supplier_3", "btn_supp_start_quote");
engine.handleSupplierAction("supplier_3", "btn_q_rate_opt2"); // ₹28,000 per MT
engine.handleSupplierAction("supplier_3", "btn_q_gst_opt1");  // GST 18%
engine.handleSupplierAction("supplier_3", "btn_q_freight_opt1"); // Freight charges ₹1,000 (Lump sum)
engine.handleSupplierAction("supplier_3", "btn_q_deliv_opt1"); // 2 business days
engine.handleSupplierAction("supplier_3", "btn_q_pay_opt1");   // 50% advance, 50% after delivery
engine.handleSupplierAction("supplier_3", "btn_q_valid_opt1"); // 3 days
engine.handleSupplierAction("supplier_3", "btn_q_docs_opt4");  // No quality documents
engine.handleSupplierAction("supplier_3", "btn_supp_confirm_submit");

// 3. Buyer generates comparison
const comp = PROCUREMENT_DATA.generateComparativeStatement();
const modalContentHtml = modal.buildComparisonDocumentHtml(comp);

const presentationCssPath = path.resolve(__dirname, '../css/presentation.css').replace(/\\/g, '/');

const simulatedIndexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Purechain AI — Bid Comparison Report (T-2)</title>
  <link rel="stylesheet" href="file:///${presentationCssPath}">
</head>
<body class="modal-open">
  <div class="app-container">
    <div style="padding: 20px;">Simulator Background (hidden in print)</div>
  </div>

  <!-- Reusable Document Modal & Statutory Report Viewer -->
  <div class="modal-overlay" id="documentModal">
    <div class="modal-dialog">
      <div class="modal-header">
        <h3 id="modalTitle">Template T-2 — Bid Comparison Report</h3>
        <button class="icon-btn" id="modalCloseBtn">✕</button>
      </div>
      <div class="modal-body" id="modalBody">
        ${modalContentHtml}
      </div>
    </div>
  </div>
</body>
</html>`;

const artifactDir = "C:\\Users\\spait\\.gemini\\antigravity\\brain\\406dc091-4ddc-4d40-abe7-65b455d9917c";
const htmlPath = path.join(artifactDir, "t2_comparison_for_pdf.html");
const pdfPath = path.join(artifactDir, "generated_t2_comparison.pdf");

fs.writeFileSync(htmlPath, simulatedIndexHtml);
console.log("HTML written to:", htmlPath);

const chromePaths = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  path.join(process.env.LOCALAPPDATA || "", "Google\\Chrome\\Application\\chrome.exe")
];

let chromeExe = null;
for (const p of chromePaths) {
  if (fs.existsSync(p)) {
    chromeExe = p;
    break;
  }
}

console.log("Using Chrome:", chromeExe);
const cmd = `"${chromeExe}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfPath}" "${htmlPath}"`;
execSync(cmd);
console.log("PDF successfully generated at:", pdfPath);

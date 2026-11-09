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
    term_3: "100% after delivery",
    term_5: "Certificate of Analysis (COA) and Test Report"
  }
});

// 2. Supplier 3 (Supplier Test) submits quote: ₹60 per kg, 5% GST, ₹1,500/MT freight (₹75,000 total)
engine.handleSupplierAction("supplier_3", "btn_supp_start_quote");
engine.handleSupplierAction("supplier_3", "btn_q_rate_opt1"); // ₹60 per kg
engine.handleSupplierAction("supplier_3", "btn_q_gst_opt2");  // GST 5%
engine.handleSupplierAction("supplier_3", null, "₹1,500 per MT"); // ₹75,000 freight
engine.handleSupplierAction("supplier_3", "btn_q_deliv_opt3"); // 7 business days
engine.handleSupplierAction("supplier_3", "btn_q_pay_opt2");   // 100% after delivery
engine.handleSupplierAction("supplier_3", "btn_q_valid_opt3"); // 15 days
engine.handleSupplierAction("supplier_3", "btn_q_docs_opt1");  // Certificate of Analysis
engine.handleSupplierAction("supplier_3", "btn_supp_confirm_submit");

// 3. Buyer generates comparison
const comp = PROCUREMENT_DATA.generateComparativeStatement();

// 4. Buyer chooses Supplier Test (supplier_3) and dispatches PO
engine.buyer_state.po_selected_supplier_id = "supplier_3";
engine.buyer_state.step = "PO_REVIEW";
const dispatchResult = engine.executePoDispatch();

// 4B. Supplier Test accepts the PO
engine.handleSupplierAction("supplier_3", "btn_supp_accept_po");
const po = PROCUREMENT_DATA.shared_store.current_po;

console.log("=== PO FINANCIAL CHECK ===");
console.log("Vendor:", po.vendor.name);
console.log("Line Item Qty:", po.line_items[0].quantity, po.line_items[0].unit);
console.log("Line Item Rate:", po.line_items[0].unit_rate);
console.log("Base Total:", po.base_total);
console.log("GST Amount:", po.gst_amount);
console.log("Freight Total:", po.freight_total);
console.log("Total Order Value:", po.total_order_value_inr);
console.log("Amount in words:", po.amount_in_words);
console.log("Payment terms:", po.payment_terms);
console.log("Delivery timeline:", po.delivery_timeline);

if (po.total_order_value_inr !== 3225000) {
  throw new Error(`CRITICAL: Total order value must be 3225000, got: ${po.total_order_value_inr}`);
}
if (po.base_total !== 3000000) {
  throw new Error(`CRITICAL: Base total must be 3000000, got: ${po.base_total}`);
}
if (po.gst_amount !== 150000) {
  throw new Error(`CRITICAL: GST amount must be 150000, got: ${po.gst_amount}`);
}
if (po.freight_total !== 75000) {
  throw new Error(`CRITICAL: Freight total must be 75000, got: ${po.freight_total}`);
}
if (!po.amount_in_words.includes("Thirty-Two Lakh Twenty-Five Thousand")) {
  throw new Error(`CRITICAL: Amount in words mismatch: ${po.amount_in_words}`);
}

// 5. Build full HTML simulating index.html with the modal open
const modalContentHtml = modal.buildPoDocumentHtml(po);
const presentationCssPath = path.resolve(__dirname, '../css/presentation.css').replace(/\\/g, '/');

const simulatedIndexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Purechain AI — Interactive WhatsApp Presentation Simulator</title>
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
        <h3 id="modalTitle">Template T-3 — Work Order / Purchase Order (WO/PO)</h3>
        <button class="icon-btn" id="modalCloseBtn">✕</button>
      </div>
      <div class="modal-body" id="modalBody">
        ${modalContentHtml}
      </div>
    </div>
  </div>
</body>
</html>`;

const tempHtmlPath = path.resolve(__dirname, 'temp_browser_print.html');
fs.writeFileSync(tempHtmlPath, simulatedIndexHtml, 'utf8');

const outputPdfPath = path.resolve('C:/Users/spait/.gemini/antigravity/brain/406dc091-4ddc-4d40-abe7-65b455d9917c/generated_t3_po.pdf');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

console.log("\nExecuting Chrome Headless print-to-pdf against simulated index.html modal...");
const chromeCmd = `"${chromePath}" --headless=new --disable-gpu --print-to-pdf="${outputPdfPath}" --no-pdf-header-footer "file:///${tempHtmlPath.replace(/\\/g, '/')}"`;
execSync(chromeCmd, { stdio: 'inherit' });

console.log("PDF generated at:", outputPdfPath);

// 6. Inspect PDF with PyMuPDF
const pyScript = `
import fitz

doc = fitz.open(r"${outputPdfPath}")
page_count = len(doc)
print(f"=== BROWSER PRINT VERIFICATION RESULT ===")
print(f"Page Count: {page_count}")

assert page_count == 2, f"CRITICAL: Expected exactly 2 pages, got {page_count}"

# Page 1 checks
p1 = doc[0]
p1_text = p1.get_text()
print("\\n--- PAGE 1 INSPECTION ---")
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
print("\\n--- PAGE 2 INSPECTION ---")
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

print("\\n>>> ALL BROWSER PRINT ASSERTIONS PASSED WITH 100% SUCCESS! <<<")
`;

const pyScriptPath = path.resolve(__dirname, 'verify_pdf_output.py');
fs.writeFileSync(pyScriptPath, pyScript, 'utf8');

execSync(`python "${pyScriptPath}"`, { stdio: 'inherit' });
console.log("\nComplete Browser Print Workflow Verification Succeeded!");

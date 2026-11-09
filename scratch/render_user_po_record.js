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
  rfq_ref: "PC-RFQ-2026-0007",
  material: "Onion",
  quantity: 50.0,
  unit: "MT",
  technical_specs: "Nashik Red Onion, Grade A (45-60mm), Moisture < 14%",
  delivery_location: "Apex Works, Hazira, Gujarat - 394270",
  terms_config: {
    term_1: "Per-unit rate with GST and freight separate; FOR destination",
    term_2: "Apex Works, Hazira, Gujarat - 394270",
    term_3: "100% against delivery at destination",
    term_4: "Supplier scope (FOR Destination)",
    term_5: "Certificate of Analysis & Test Certificate"
  }
});

// 2. Setup supplier_3 with the exact test record:
// 50 MT @ ₹28,000/MT (equivalent to ₹28/kg), 5% GST (₹70,000), Freight ₹1,000
const s3State = engine.createInitialSupplierState("supplier_3");
engine.supplier_states["supplier_3"] = s3State;
s3State.data = {
  unit_rate_val: 28000.0,
  unit_rate_unit: "MT",
  unit_rate_display: "₹28,000 / MT (₹28 / kg)",
  qty_in_quoted_unit: 50,
  base_amount: 1400000,
  calc_str: "50 MT × ₹28,000 / MT",
  gst_rate: 5,
  gst_display: "5%",
  gst_amount: 70000,
  freight_amount: 1000,
  freight_display: "₹1,000 fixed total freight",
  delivery_period: "2 days from PO issuance",
  payment_terms: "100% against delivery at destination",
  quotation_validity: "30 days from submission",
  quality_docs: "Certificate of Analysis & Test Certificate"
};
engine.executeSupplierQuoteSubmission("supplier_3");

// 3. Buyer generates comparison
const comp = PROCUREMENT_DATA.generateComparativeStatement("PC-RFQ-2026-0007");

// 4. Buyer chooses supplier_3 and dispatches PO
engine.buyer_state.po_selected_supplier_id = "supplier_3";
engine.buyer_state.po_rfq_ref = "PC-RFQ-2026-0007";
engine.buyer_state.po_ref = "PC-PO-2026-0007";
engine.buyer_state.step = "PO_REVIEW";
const dispatchResult = engine.executePoDispatch();

// 5. Supplier accepts the PO
engine.handleSupplierAction("supplier_3", "btn_supp_accept_po");
const po = PROCUREMENT_DATA.shared_store.current_po;

console.log("=== PO FINANCIAL CHECK ===");
console.log("Vendor:", po.vendor.name);
console.log("Line Item Qty:", po.line_items[0].quantity, po.line_items[0].unit);
console.log("Line Item Rate:", po.line_items[0].unit_rate);
console.log("Line Item Specs:", po.line_items[0].specs);
console.log("Base Total:", po.base_total);
console.log("GST Amount:", po.gst_amount);
console.log("Freight Total:", po.freight_total);
console.log("Total Order Value:", po.total_order_value_inr);
console.log("Amount in words:", po.amount_in_words);
console.log("Buyer Signatory:", po.buyer_signatory_name);
console.log("Supplier Signatory:", po.supplier_signatory_name);

if (po.total_order_value_inr !== 1471000) {
  throw new Error(`CRITICAL: Total order value must be 1471000, got: ${po.total_order_value_inr}`);
}
if (po.base_total !== 1400000) {
  throw new Error(`CRITICAL: Base total must be 1400000, got: ${po.base_total}`);
}
if (po.gst_amount !== 70000) {
  throw new Error(`CRITICAL: GST amount must be 70000, got: ${po.gst_amount}`);
}
if (po.freight_total !== 1000) {
  throw new Error(`CRITICAL: Freight total must be 1000, got: ${po.freight_total}`);
}
if (po.amount_in_words !== "Indian Rupees Fourteen Lakh Seventy-One Thousand Only") {
  throw new Error(`CRITICAL: Amount in words mismatch: ${po.amount_in_words}`);
}

// 6. Build full HTML simulating index.html with the modal open
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

// 7. Inspect PDF with PyMuPDF
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
assert "28,000.00" in p1_text, "Missing Rate 28,000.00 on page 1"
assert "Quoted at ₹28/kg" in p1_text, "Missing Quoted at ₹28/kg on page 1"
assert "14,00,000.00" in p1_text, "Missing Base subtotal 14,00,000.00 on page 1"
assert "70,000.00" in p1_text, "Missing GST 70,000.00 on page 1"
assert "1,000.00" in p1_text, "Missing Freight 1,000.00 on page 1"
assert "14,71,000.00" in p1_text, "Missing Total 14,71,000.00 on page 1"
assert "Fourteen Lakh Seventy-One Thousand" in p1_text, "Missing words Fourteen Lakh Seventy-One Thousand on page 1"
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

print("\\n>>> ALL BROWSER PRINT & RATE INTEGRITY ASSERTIONS PASSED WITH 100% SUCCESS! <<<")
`;

const pyScriptPath = path.resolve(__dirname, 'verify_pdf_output.py');
fs.writeFileSync(pyScriptPath, pyScript, 'utf8');

execSync(`python "${pyScriptPath}"`, { stdio: 'inherit' });
console.log("\nComplete Browser Print Workflow Verification Succeeded!");


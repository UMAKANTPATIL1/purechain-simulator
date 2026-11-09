/**
 * True End-to-End Regression Test:
 * 1. Supplier Test follows actual chat submission path with ₹1,500/MT freight (yielding ₹75,000).
 * 2. Buyer generates initial T-2 comparison verifying ₹75,000 freight and ₹34.54/kg.
 * 3. Switches back to Supplier Test in chat.
 * 4. Supplier Test revises quotation / changes freight from ₹1,500/MT to ₹1,000 lump sum.
 * 5. Re-submits through executeSupplierQuoteSubmission().
 * 6. Asserts saved quotation freight = ₹1,000, type = lump_sum, landed = ₹16,53,000.
 * 7. Switches to Buyer, regenerates T-2 report.
 * 8. Asserts T-2 freight = ₹1,000, total landed = ₹16,53,000, landed/kg = ₹33.06.
 * 9. Compiles T-2 HTML and generates actual PDF via headless Chrome.
 * 10. Inspects PDF text via PyMuPDF verifying ₹1,000 freight and zero ₹75,000 in Supplier Test column.
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

global.window = {};
global.document = {
  body: { classList: { add: () => { }, remove: () => { } } },
  querySelector: () => ({ classList: { add: () => { }, remove: () => { } }, style: {} }),
  querySelectorAll: () => [],
  getElementById: (id) => ({
    classList: { add: () => { }, remove: () => { } },
    style: {},
    innerHTML: "",
    appendChild: () => { },
    addEventListener: () => { }
  }),
  createElement: () => ({ style: {}, classList: { add: () => { } }, setAttribute: () => { } })
};

const PROCUREMENT_DATA = require("../js/data/procurement_data.js");
global.PROCUREMENT_DATA = PROCUREMENT_DATA;
window.PROCUREMENT_DATA = PROCUREMENT_DATA;

const ProcurementEngine = require("../js/engines/procurement_engine.js");
const DocumentModal = require("../js/ui/document_modal.js");

const modal = new DocumentModal();
window.documentModal = modal;

console.log("======================================================================");
console.log("TRUE END-TO-END REGRESSION TEST: CHAT FREIGHT REVISION & T-2 PDF");
console.log("======================================================================");

// Step 1: Initialize store & Buyer creates RFQ (50 MT Onion)
PROCUREMENT_DATA.initStore();
const engine = new ProcurementEngine();

const rfq = PROCUREMENT_DATA.createRFQ({
  commodity: "Onion",
  quantity: 50.0,
  unit: "MT",
  delivery_location: "Hazira Works, Surat, Gujarat - 394510"
});
PROCUREMENT_DATA.dispatchRFQ();

console.log("\n[STEP 1] Initial Supplier Test quote with ₹1,500/MT (yielding ₹75,000 freight)...");
engine.switchParticipant("supplier_3");
engine.handleSupplierAction("supplier_3", "btn_supp_start_quote");
engine.handleSupplierAction("supplier_3", "btn_q_rate_opt2");    // ₹28,000 per MT
engine.handleSupplierAction("supplier_3", "btn_q_gst_opt1");     // GST 18%
engine.handleSupplierAction("supplier_3", "btn_q_freight_opt2"); // ₹1,500 per MT (Per-MT rate)
engine.handleSupplierAction("supplier_3", "btn_q_deliv_opt1");   // 2 days
engine.handleSupplierAction("supplier_3", "btn_q_pay_opt1");     // 50%
engine.handleSupplierAction("supplier_3", "btn_q_valid_opt1");   // 3 days
engine.handleSupplierAction("supplier_3", "btn_q_docs_opt4");    // No docs
const initialSubmit = engine.handleSupplierAction("supplier_3", "btn_supp_confirm_submit");

// Verify initial stored quote
const qInitial = PROCUREMENT_DATA.shared_store.supplier_assignments["supplier_3"].quotation;
console.log("  Initial quote freight_amount:", qInitial.freight_amount);
console.log("  Initial quote freight_type:", qInitial.freight_type);
console.log("  Initial quote total_landed:", qInitial.total_landed_amount);
assert.strictEqual(qInitial.freight_amount, 75000, "Initial freight must be 75,000 (1500 * 50)");
assert.strictEqual(qInitial.freight_type, "per_mt", "Initial freight type must be per_mt");
assert.strictEqual(qInitial.total_landed_amount, 1727000, "Initial landed cost must be 17,27,000");

// Step 2: Buyer generates initial T-2 report
console.log("\n[STEP 2] Buyer generates initial T-2 comparison...");
engine.switchParticipant("buyer");
const initCompMsg = engine.executeGenerateComparison();
const compInitial = PROCUREMENT_DATA.shared_store.current_comparison;
const s3ColInit = compInitial.columns.find(c => c.supplier_id === "supplier_3");
console.log("  Initial T-2 freight:", s3ColInit.freight_display);
console.log("  Initial T-2 total landed:", s3ColInit.total_landed_cost);
console.log("  Initial T-2 landed/kg:", s3ColInit.normalized_landed_per_kg);
assert.strictEqual(s3ColInit.freight_amount, 75000);
assert.strictEqual(s3ColInit.total_landed_cost, 1727000);
assert.strictEqual(s3ColInit.normalized_landed_per_kg, 34.54);

// Step 3: Switch back to Supplier Test and revise freight to ₹1,000 lump sum
console.log("\n[STEP 3] Supplier Test revises quotation in chat to ₹1,000 lump sum...");
engine.switchParticipant("supplier_3");

// Supplier clicks "✏️ Revise Quotation"
const reviseSummary = engine.handleSupplierAction("supplier_3", "btn_supp_revise_quote");
assert.ok(reviseSummary, "Must allow quotation revision");

// Supplier clicks "3️⃣ Freight Charges" to edit field 3
engine.handleSupplierAction("supplier_3", "btn_edit_q3");

// Supplier selects Option 1: "Freight charges ₹1,000" (Lump sum)
const editFreightRes = engine.handleSupplierAction("supplier_3", "btn_q_freight_opt1");

// Supplier confirms revised submission
const revisedSubmitRes = engine.handleSupplierAction("supplier_3", "btn_supp_confirm_submit");
console.log("  Revised confirmation snippet:\n ", revisedSubmitRes.text.split("\n").filter(l => l.includes("Freight") || l.includes("Total Landed") || l.includes("Revision")).join("\n  "));

// Step 4: Verify saved quotation in shared_store
console.log("\n[STEP 4] Verifying saved quotation in shared_store...");
const qRevised = PROCUREMENT_DATA.shared_store.supplier_assignments["supplier_3"].quotation;
console.log("  Saved freight_amount:", qRevised.freight_amount);
console.log("  Saved freight_type:", qRevised.freight_type);
console.log("  Saved freight_display:", qRevised.freight_display);
console.log("  Saved total_landed_amount:", qRevised.total_landed_amount);
console.log("  Revision number:", qRevised.revision);

assert.strictEqual(qRevised.freight_amount, 1000, "Saved quotation freight must be exactly ₹1,000");
assert.strictEqual(qRevised.freight_type, "lump_sum", "Saved freight type must be lump_sum");
assert.strictEqual(qRevised.total_landed_amount, 1653000, "Saved total landed amount must be ₹16,53,000");
assert.strictEqual(qRevised.revision, "Rev 1", "Revision must be incremented to Rev 1");

// Step 5: Switch to Buyer, generate T-2 comparison
console.log("\n[STEP 5] Switching to buyer and generating T-2 comparison...");
engine.switchParticipant("buyer");
const compRevisedMsg = engine.executeGenerateComparison();
const compRevised = PROCUREMENT_DATA.shared_store.current_comparison;
const s3ColRev = compRevised.columns.find(c => c.supplier_id === "supplier_3");

console.log("  T-2 freight_amount:", s3ColRev.freight_amount);
console.log("  T-2 freight_display:", s3ColRev.freight_display);
console.log("  T-2 total_landed_cost:", s3ColRev.total_landed_cost);
console.log("  T-2 normalized_landed_per_kg:", s3ColRev.normalized_landed_per_kg);
console.log("  T-2 landed_cost_per_unit_display:", s3ColRev.landed_cost_per_unit_display);

assert.strictEqual(s3ColRev.freight_amount, 1000, "T-2 freight must be ₹1,000");
assert.strictEqual(s3ColRev.freight_display, "INR 1,000.00", "T-2 freight display must be INR 1,000.00");
assert.strictEqual(s3ColRev.total_landed_cost, 1653000, "T-2 total landed cost must be ₹16,53,000");
assert.strictEqual(s3ColRev.normalized_landed_per_kg, 33.06, "T-2 landed cost/kg must be ₹33.06");
assert.strictEqual(s3ColRev.landed_cost_per_unit_display, "INR 33.06/kg");

// Step 6: Verify T-2 HTML and generate fresh PDF via headless Chrome
console.log("\n[STEP 6] Generating fresh T-2 PDF via headless Chrome...");
const modalHtml = modal.buildComparisonDocumentHtml(compRevised);
const presentationCssPath = path.resolve(__dirname, "../css/presentation.css").replace(/\\/g, "/");

const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Purechain AI — Bid Comparison Report (T-2)</title>
  <link rel="stylesheet" href="file:///${presentationCssPath}">
</head>
<body class="modal-open">
  <div class="modal-overlay" id="documentModal">
    <div class="modal-dialog">
      <div class="modal-header">
        <h3 id="modalTitle">Template T-2 — Bid Comparison Report</h3>
      </div>
      <div class="modal-body" id="modalBody">
        ${modalHtml}
      </div>
    </div>
  </div>
</body>
</html>`;

const artifactDir = "C:\\Users\\spait\\.gemini\\antigravity\\brain\\406dc091-4ddc-4d40-abe7-65b455d9917c";
const htmlPath = path.join(artifactDir, "t2_comparison_e2e_verified.html");
const pdfPath = path.join(artifactDir, "generated_t2_comparison.pdf");

fs.writeFileSync(htmlPath, fullHtml);

const chromeExe = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const printCmd = `"${chromeExe}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfPath}" "${htmlPath}"`;
execSync(printCmd);

console.log("  Fresh PDF generated at:", pdfPath);

// Step 7: Inspect PDF text with Python PyMuPDF
console.log("\n[STEP 7] Inspecting fresh PDF text via PyMuPDF...");
const pyOut = execSync(`python purechain-simulator/scratch/verify_pdf.py "${pdfPath}"`).toString();
console.log(pyOut);

console.log("\n======================================================================");
console.log("TRUE END-TO-END REGRESSION TEST COMPLETED WITH 100% SUCCESS!");
console.log("======================================================================");

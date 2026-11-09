/**
 * Automated Regression Test Suite: Freight Charge Integrity & Consistency
 * 
 * Verifies:
 * 1. ₹1,000 lump sum on 50 MT -> ₹1,000 freight (NOT multiplied by 50 MT).
 * 2. ₹1,500 per MT on 50 MT -> ₹75,000 freight.
 * 3. ₹0 freight included in rate -> ₹0 additional freight.
 * 4. Submitted quotation, WhatsApp summary, and T-2 PDF all show the exact same freight value.
 * 5. Specific user test record: 50 MT @ ₹28,000/MT, GST 18%, ₹1,000 Lump sum -> Total ₹16,53,000, Landed ₹33.06/kg.
 * 6. Quotation edits and re-submissions properly update stored freight without serving stale reports.
 */

const assert = require("assert");

global.window = {};
global.document = {
  body: { classList: { add: () => {}, remove: () => {} } },
  querySelector: () => ({ classList: { add: () => {}, remove: () => {} }, style: {} }),
  querySelectorAll: () => [],
  getElementById: (id) => ({
    classList: { add: () => {}, remove: () => {} },
    style: {},
    innerHTML: "",
    appendChild: () => {},
    addEventListener: () => {}
  }),
  createElement: () => ({ style: {}, classList: { add: () => {} }, setAttribute: () => {} })
};

const PROCUREMENT_DATA = require("../js/data/procurement_data.js");
global.PROCUREMENT_DATA = PROCUREMENT_DATA;
window.PROCUREMENT_DATA = PROCUREMENT_DATA;
const ProcurementEngine = require("../js/engines/procurement_engine.js");
const DocumentModal = require("../js/ui/document_modal.js");

const modal = new DocumentModal();
window.documentModal = modal;

console.log("======================================================================");
console.log("SUITE: FREIGHT CHARGE CONSISTENCY & INTEGRITY REGRESSION TESTS");
console.log("======================================================================");

// -------------------------------------------------------------
// Test 1: ₹1,000 lump sum on 50 MT -> ₹1,000 freight
// -------------------------------------------------------------
console.log("\n[TEST 1] Verifying ₹1,000 lump sum on 50 MT -> ₹1,000 freight (never multiplied by 50 MT)...");
const f1 = PROCUREMENT_DATA.normalizeFreight({
  freight_amount: 1000,
  freight_display: "₹1,000 (Lump sum)"
}, 50.0, "MT");

assert.strictEqual(f1.freight_amount, 1000, "Freight amount must be exactly 1,000");
assert.strictEqual(f1.freight_type, "lump_sum", "Freight type must be lump_sum");
assert.strictEqual(f1.display, "INR 1,000.00", "Display must be INR 1,000.00");
assert.notStrictEqual(f1.freight_amount, 50000, "MUST NOT multiply 1,000 by 50 MT!");
assert.notStrictEqual(f1.freight_amount, 75000, "MUST NOT read stale 75,000!");
console.log("  -> PASS: ₹1,000 lump sum on 50 MT correctly evaluated as ₹1,000 freight!");

// -------------------------------------------------------------
// Test 2: ₹1,500 per MT on 50 MT -> ₹75,000 freight
// -------------------------------------------------------------
console.log("\n[TEST 2] Verifying ₹1,500 per MT on 50 MT -> ₹75,000 freight...");
const f2a = PROCUREMENT_DATA.normalizeFreight({
  freight_amount_per_mt: 1500.0,
  freight_display: "₹1,500 / MT"
}, 50.0, "MT");

assert.strictEqual(f2a.freight_amount, 75000, "1500/MT on 50 MT must equal 75,000 total freight");
assert.strictEqual(f2a.freight_type, "per_mt", "Freight type must be per_mt");
assert.strictEqual(f2a.rate_per_mt, 1500, "Rate per MT must be 1500");
assert.strictEqual(f2a.display, "INR 75,000.00", "Display must be INR 75,000.00");

// Also test when display has "₹1,500 per MT"
const f2b = PROCUREMENT_DATA.normalizeFreight({
  freight_amount: 75000,
  freight_display: "₹75,000 (₹1,500/MT × 50 MT)"
}, 50.0, "MT");
assert.strictEqual(f2b.freight_amount, 75000);
assert.strictEqual(f2b.freight_type, "per_mt");
assert.strictEqual(f2b.display, "INR 75,000.00");
console.log("  -> PASS: ₹1,500 per MT on 50 MT correctly evaluated as ₹75,000 freight!");

// -------------------------------------------------------------
// Test 3: ₹0 freight included in rate -> ₹0 additional freight
// -------------------------------------------------------------
console.log("\n[TEST 3] Verifying ₹0 freight included in rate -> ₹0 additional freight...");
const f3a = PROCUREMENT_DATA.normalizeFreight({
  freight_amount: 0,
  freight_display: "₹0 (Freight included in rate)"
}, 50.0, "MT");

assert.strictEqual(f3a.freight_amount, 0, "Freight amount must be 0");
assert.strictEqual(f3a.freight_type, "included", "Freight type must be included");
assert.strictEqual(f3a.display, "INR 0.00 (Included)", "Display must show Included");

const f3b = PROCUREMENT_DATA.normalizeFreight({
  freight_display: "Freight included in rate"
}, 50.0, "MT");
assert.strictEqual(f3b.freight_amount, 0);
assert.strictEqual(f3b.freight_type, "included");
console.log("  -> PASS: ₹0 freight included in rate correctly evaluated as ₹0 additional freight!");

// -------------------------------------------------------------
// Test 4: End-to-End Simulation of User's Specific Quotation Record
// -------------------------------------------------------------
console.log("\n[TEST 4] Testing end-to-end user scenario: Supplier Test quotes ₹28,000/MT, GST 18%, Freight ₹1,000 lump sum...");
const engine = new ProcurementEngine();

// 1. Initialize RFQ PC-RFQ-2026-0113 for 50 MT Onion
PROCUREMENT_DATA.initStore();
const rfq = PROCUREMENT_DATA.createRFQ({
  rfq_ref: "PC-RFQ-2026-0113",
  material: "Onion",
  quantity: 50.0,
  unit: "MT",
  delivery_location: "Hazira Works, Surat, Gujarat - 394510",
  selected_suppliers: ["supplier_1", "supplier_2", "supplier_3"]
});
engine.buyer_state.rfq_ref = rfq.rfq_ref;
engine.buyer_state.quantity = 50.0;
engine.buyer_state.unit = "MT";

// 2. Supplier Test (supplier_3) interacts via WhatsApp simulation:
// - Rate: ₹28,000 per MT (Option 2)
// - GST: 18% (Option 1)
// - Freight: Freight charges ₹1,000 (Option 1)
engine.handleSupplierAction("supplier_3", "btn_supp_start_quote");
engine.handleSupplierAction("supplier_3", "btn_q_rate_opt2");    // ₹28,000 per MT
engine.handleSupplierAction("supplier_3", "btn_q_gst_opt1");     // GST 18%
engine.handleSupplierAction("supplier_3", "btn_q_freight_opt1"); // Freight charges ₹1,000 (Lump sum)
engine.handleSupplierAction("supplier_3", "btn_q_deliv_opt1");   // Delivery period 2 days
engine.handleSupplierAction("supplier_3", "btn_q_pay_opt1");     // 50% advance, 50% after delivery
engine.handleSupplierAction("supplier_3", "btn_q_valid_opt1");   // 3 days
engine.handleSupplierAction("supplier_3", "btn_q_docs_opt4");    // No quality documents

// Verify WhatsApp quotation summary before submitting
const suppSummary = engine.renderSupplierQuoteSummary("supplier_3");
assert.ok(suppSummary.text.includes("₹28,000 / MT") || suppSummary.text.includes("₹28,000 per MT"), "Base rate shown in summary");
assert.ok(suppSummary.text.includes("Base Amount:* *₹14,00,000*"), "Base amount is ₹14,00,000");
assert.ok(suppSummary.text.includes("GST Rate & Amount:* *18%* _(₹2,52,000)_") || suppSummary.text.includes("₹2,52,000"), "GST amount is ₹2,52,000");
assert.ok(suppSummary.text.includes("Freight Charges:* *₹1,000 (Lump sum)*"), "Freight charges shown as ₹1,000 (Lump sum)");
assert.ok(suppSummary.text.includes("Total Landed Amount:* *₹16,53,000*"), "Total landed is ₹16,53,000");

// Confirm Submission
const submitResult = engine.handleSupplierAction("supplier_3", "btn_supp_confirm_submit");
assert.ok(submitResult.text.includes("Base Amount:* ₹14,00,000"), "Base amount ₹14,00,000 in confirmation");
assert.ok(submitResult.text.includes("GST:* 18% _(₹2,52,000)_"), "GST ₹2,52,000 in confirmation");
assert.ok(submitResult.text.includes("Freight:* ₹1,000 _(₹1,000 (Lump sum))_"), "Freight ₹1,000 in confirmation");
assert.ok(submitResult.text.includes("Total Landed Amount:* *₹16,53,000*"), "Total Landed ₹16,53,000 in confirmation");

// Verify stored quotation in shared_store
const savedQuote = PROCUREMENT_DATA.shared_store.supplier_assignments["supplier_3"].quotation;
assert.ok(savedQuote, "Quotation must be saved in shared_store");
assert.strictEqual(savedQuote.freight_amount, 1000, "Stored freight_amount must be exactly 1000");
assert.strictEqual(savedQuote.freight_type, "lump_sum", "Stored freight_type must be lump_sum");
assert.strictEqual(savedQuote.base_amount, 1400000, "Stored base_amount must be 14,00,000");
assert.strictEqual(savedQuote.gst_amount, 252000, "Stored gst_amount must be 2,52,000");
assert.strictEqual(savedQuote.total_landed_amount, 1653000, "Stored total_landed_amount must be 16,53,000");

console.log("  -> PASS: Supplier Test quotation submitted and saved with exact ₹1,000 lump sum!");

// -------------------------------------------------------------
// Test 5: Verify T-2 Comparison Report & WhatsApp Summary Output
// -------------------------------------------------------------
console.log("\n[TEST 5] Verifying T-2 comparison statement and WhatsApp summary match ₹1,000 freight...");
const compMsg = engine.executeGenerateComparison();
const report = PROCUREMENT_DATA.shared_store.current_comparison;

// Inspect Supplier Test column in T-2 report
const s3Col = report.columns.find(c => c.supplier_id === "supplier_3");
assert.ok(s3Col, "Supplier Test column present in T-2");
assert.strictEqual(s3Col.status, "SUBMITTED", "Supplier Test status is SUBMITTED");
assert.strictEqual(s3Col.freight_amount, 1000, "T-2 freight_amount must be exactly 1,000");
assert.strictEqual(s3Col.freight_display, "INR 1,000.00", "T-2 freight_display must be INR 1,000.00");
assert.notStrictEqual(s3Col.freight_display, "INR 75,000.00", "T-2 freight MUST NOT be stale INR 75,000.00");
assert.strictEqual(s3Col.base_amount, 1400000, "T-2 base_amount must be 14,00,000");
assert.strictEqual(s3Col.gst_amount, 252000, "T-2 gst_amount must be 2,52,000");
assert.strictEqual(s3Col.total_landed_cost, 1653000, "T-2 total_landed_cost must be exactly 16,53,000 (14,00,000 + 2,52,000 + 1,000)");
assert.strictEqual(s3Col.total_landed_cost_display, "INR 16,53,000.00", "T-2 total landed cost display must be INR 16,53,000.00");
assert.strictEqual(s3Col.normalized_landed_per_kg, 33.06, "Normalized landed cost must be exactly ₹33.06/kg (16,53,000 / 50,000)");
assert.strictEqual(s3Col.landed_cost_per_unit_display, "INR 33.06/kg", "Landed cost per unit display must be INR 33.06/kg");

// Verify Buyer's WhatsApp summary text
assert.ok(compMsg.text.includes("• *Freight Charges:* INR 1,000.00"), "WhatsApp summary shows Freight Charges: INR 1,000.00");
assert.ok(compMsg.text.includes("• *Total Landed Cost:* *INR 16,53,000.00*"), "WhatsApp summary shows Total Landed Cost: INR 16,53,000.00");
assert.ok(compMsg.text.includes("• *Normalized Landed Cost (kg):* *INR 33.06/kg*"), "WhatsApp summary shows Normalized Landed Cost: INR 33.06/kg");
assert.ok(!compMsg.text.includes("INR 75,000.00"), "WhatsApp summary MUST NOT contain INR 75,000.00");

// Verify T-2 HTML table row 3 (Freight / other charges)
const t2Html = modal.buildComparisonDocumentHtml(report);
assert.ok(t2Html.includes("<td>INR 1,000.00</td>"), "T-2 HTML contains <td>INR 1,000.00</td>");
assert.ok(t2Html.includes("<strong>INR 33.06/kg</strong>"), "T-2 HTML contains Landed cost <strong>INR 33.06/kg</strong>");
assert.ok(t2Html.includes("<td>INR 16,53,000.00</td>"), "T-2 HTML contains Total landed cost <td>INR 16,53,000.00</td>");
assert.ok(!t2Html.includes("INR 75,000.00"), "T-2 HTML MUST NOT contain INR 75,000.00");

console.log("  -> PASS: Submitted quote, WhatsApp summary, and T-2 HTML all show identical ₹1,000 freight and ₹33.06/kg landed cost!");

// -------------------------------------------------------------
// Test 6: Verify Quotation Re-Submission & Cache Invalidation
// (Ensures editing quotation from ₹1,500/MT to ₹1,000 lump sum properly updates store)
// -------------------------------------------------------------
console.log("\n[TEST 6] Testing quotation update and comparison cache invalidation...");
// Submit quote with ₹1,500/MT freight for Supplier 1
PROCUREMENT_DATA.submitQuotation("supplier_1", {
  quotation_ref: "QT-2026-S1-TEST1500",
  unit_rate_val: 28000.0,
  unit_rate_unit: "MT",
  unit_rate_display: "INR 28,000.00/MT",
  base_amount: 1400000,
  gst_rate: 18.0,
  gst_amount: 252000,
  freight_amount: 75000,
  freight_display: "₹75,000 (₹1,500/MT × 50 MT)",
  total_landed_amount: 1727000,
  delivery_period: "5 days",
  payment_terms: "100% after delivery",
  quotation_validity: "15 days",
  quality_docs: "CoA"
});

const repInitial = PROCUREMENT_DATA.generateComparativeStatement("PC-RFQ-2026-0113");
const s1Initial = repInitial.columns.find(c => c.supplier_id === "supplier_1");
assert.strictEqual(s1Initial.freight_amount, 75000);
assert.strictEqual(s1Initial.freight_display, "INR 75,000.00");

// Now Supplier 1 updates quotation to ₹1,000 lump sum
PROCUREMENT_DATA.submitQuotation("supplier_1", {
  quotation_ref: "QT-2026-S1-TEST1000",
  unit_rate_val: 28000.0,
  unit_rate_unit: "MT",
  unit_rate_display: "INR 28,000.00/MT",
  base_amount: 1400000,
  gst_rate: 18.0,
  gst_amount: 252000,
  freight_amount: 1000,
  freight_display: "₹1,000 (Lump sum)",
  total_landed_amount: 1653000,
  delivery_period: "5 days",
  payment_terms: "100% after delivery",
  quotation_validity: "15 days",
  quality_docs: "CoA",
  allow_update: true
});

// Cache must have been invalidated
assert.strictEqual(PROCUREMENT_DATA.shared_store.current_comparison, null, "Cache must be cleared on submission");

// Regenerated report reflects updated freight
const repUpdated = PROCUREMENT_DATA.generateComparativeStatement("PC-RFQ-2026-0113");
const s1Updated = repUpdated.columns.find(c => c.supplier_id === "supplier_1");
assert.strictEqual(s1Updated.freight_amount, 1000, "Updated quotation freight must be 1,000");
assert.strictEqual(s1Updated.freight_display, "INR 1,000.00", "Updated freight display must be INR 1,000.00");
assert.strictEqual(s1Updated.total_landed_cost, 1653000, "Updated total landed cost must be 16,53,000");

console.log("  -> PASS: Quotation update and cache invalidation working with zero stale data leaks!");

console.log("\n======================================================================");
console.log("ALL FREIGHT CONSISTENCY & INTEGRITY REGRESSION TESTS PASSED (100% GREEN)!");
console.log("======================================================================");

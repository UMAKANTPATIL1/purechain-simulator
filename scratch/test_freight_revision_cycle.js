/**
 * Comprehensive Freight Options & Revision Cycle Regression Test Suite
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
console.log("SUITE: FREIGHT PARSING, NORMALIZATION & REVISION CYCLE TESTS");
console.log("======================================================================");

const engine = new ProcurementEngine();

// -------------------------------------------------------------
// Part 1: Required Option Definitions & Parsing on 50 MT
// -------------------------------------------------------------
console.log("\n[TEST 1] Verifying parseFreightCharges for all 4 required options...");

// 1. Freight charges ₹1,000 -> lump_sum, 1000, ₹1,000
const opt1 = engine.parseFreightCharges("Freight charges ₹1,000", 50);
assert.strictEqual(opt1.freight_type, "lump_sum", "Opt 1 freight_type must be lump_sum");
assert.strictEqual(opt1.freight_amount, 1000, "Opt 1 freight_amount must be 1000");
assert.strictEqual(opt1.is_per_mt, false, "Opt 1 is_per_mt must be false");
assert.strictEqual(opt1.freight_amount_per_mt, undefined, "Opt 1 must not have freight_amount_per_mt");
console.log("  -> PASS: Option 1 ('Freight charges ₹1,000') -> lump_sum, 1000");

// 2. ₹1,500 per MT -> per_mt, 1500, 75000
const opt2 = engine.parseFreightCharges("₹1,500 per MT", 50);
assert.strictEqual(opt2.freight_type, "per_mt", "Opt 2 freight_type must be per_mt");
assert.strictEqual(opt2.freight_amount_per_mt, 1500, "Opt 2 freight_amount_per_mt must be 1500");
assert.strictEqual(opt2.freight_amount, 75000, "Opt 2 total freight must be 1500 * 50 = 75000");
assert.strictEqual(opt2.is_per_mt, true, "Opt 2 is_per_mt must be true");
console.log("  -> PASS: Option 2 ('₹1,500 per MT') -> per_mt, 1500/MT, 75,000 total");

// 3. ₹2,000 per MT -> per_mt, 2000, 100000
const opt3 = engine.parseFreightCharges("₹2,000 per MT", 50);
assert.strictEqual(opt3.freight_type, "per_mt", "Opt 3 freight_type must be per_mt");
assert.strictEqual(opt3.freight_amount_per_mt, 2000, "Opt 3 freight_amount_per_mt must be 2000");
assert.strictEqual(opt3.freight_amount, 100000, "Opt 3 total freight must be 2000 * 50 = 100000");
assert.strictEqual(opt3.is_per_mt, true, "Opt 3 is_per_mt must be true");
console.log("  -> PASS: Option 3 ('₹2,000 per MT') -> per_mt, 2000/MT, 1,00,000 total");

// 4. ₹0 (Freight included in rate) -> included, 0
const opt4 = engine.parseFreightCharges("₹0 (Freight included in rate)", 50);
assert.strictEqual(opt4.freight_type, "included", "Opt 4 freight_type must be included");
assert.strictEqual(opt4.freight_amount, 0, "Opt 4 freight_amount must be 0");
assert.strictEqual(opt4.is_per_mt, false, "Opt 4 is_per_mt must be false");
console.log("  -> PASS: Option 4 ('₹0 (Freight included in rate)') -> included, 0");

// -------------------------------------------------------------
// Part 2: Normalization on 50 MT
// -------------------------------------------------------------
console.log("\n[TEST 2] Verifying normalizeFreight on 50 MT...");

// ₹1,000 lump sum -> ₹1,000
const n1 = PROCUREMENT_DATA.normalizeFreight({
  freight_type: "lump_sum",
  freight_amount: 1000,
  freight_display: "₹1,000 (Lump sum)"
}, 50, "MT");
assert.strictEqual(n1.freight_amount, 1000);
assert.strictEqual(n1.freight_type, "lump_sum");
assert.strictEqual(n1.display, "INR 1,000.00");
console.log("  -> PASS: ₹1,000 lump sum -> INR 1,000.00");

// ₹1,500/MT -> ₹75,000
const n2 = PROCUREMENT_DATA.normalizeFreight({
  freight_type: "per_mt",
  freight_amount_per_mt: 1500,
  freight_display: "₹75,000 (₹1,500/MT × 50 MT)"
}, 50, "MT");
assert.strictEqual(n2.freight_amount, 75000);
assert.strictEqual(n2.freight_type, "per_mt");
assert.strictEqual(n2.rate_per_mt, 1500);
assert.strictEqual(n2.display, "INR 75,000.00");
console.log("  -> PASS: ₹1,500/MT -> INR 75,000.00");

// ₹2,000/MT -> ₹1,00,000
const n3 = PROCUREMENT_DATA.normalizeFreight({
  freight_type: "per_mt",
  freight_amount_per_mt: 2000,
  freight_display: "₹1,00,000 (₹2,000/MT × 50 MT)"
}, 50, "MT");
assert.strictEqual(n3.freight_amount, 100000);
assert.strictEqual(n3.freight_type, "per_mt");
assert.strictEqual(n3.rate_per_mt, 2000);
assert.strictEqual(n3.display, "INR 1,00,000.00");
console.log("  -> PASS: ₹2,000/MT -> INR 1,00,000.00");

// Freight included -> ₹0
const n4 = PROCUREMENT_DATA.normalizeFreight({
  freight_type: "included",
  freight_amount: 0,
  freight_display: "₹0 (Freight included in rate)"
}, 50, "MT");
assert.strictEqual(n4.freight_amount, 0);
assert.strictEqual(n4.freight_type, "included");
assert.strictEqual(n4.display, "INR 0.00 (Included)");
console.log("  -> PASS: Freight included -> INR 0.00 (Included)");

// -------------------------------------------------------------
// Part 3: Full Quotation Revision Workflow Back & Forth
// (Changing from ₹1,500/MT to ₹1,000 lump sum and back again)
// -------------------------------------------------------------
console.log("\n[TEST 3] Testing revision cycle: ₹1,500/MT -> ₹1,000 lump sum -> ₹1,500/MT -> ₹2,000/MT -> ₹0 -> ₹1,000 lump sum...");

// Initialize RFQ for 50 MT Onion
PROCUREMENT_DATA.initStore();
const rfq = PROCUREMENT_DATA.createRFQ({
  rfq_ref: "PC-RFQ-2026-0113",
  material: "Onion",
  quantity: 50.0,
  unit: "MT",
  selected_suppliers: ["supplier_1", "supplier_2", "supplier_3"]
});
PROCUREMENT_DATA.dispatchRFQ();
engine.buyer_state.rfq_ref = rfq.rfq_ref;

// 1. Initial Submission (Rev 0) with ₹1,500 per MT (Option 2)
engine.handleSupplierAction("supplier_3", "btn_supp_start_quote");
engine.handleSupplierAction("supplier_3", "btn_q_rate_opt2");    // ₹28,000 per MT -> Base = 14,00,000
engine.handleSupplierAction("supplier_3", "btn_q_gst_opt1");     // 18% -> GST = 2,52,000
engine.handleSupplierAction("supplier_3", "btn_q_freight_opt2"); // ₹1,500 per MT -> Freight = 75,000
engine.handleSupplierAction("supplier_3", "btn_q_deliv_opt1");
engine.handleSupplierAction("supplier_3", "btn_q_pay_opt1");
engine.handleSupplierAction("supplier_3", "btn_q_valid_opt1");
engine.handleSupplierAction("supplier_3", "btn_q_docs_opt1");
engine.handleSupplierAction("supplier_3", "btn_supp_confirm_submit");

let q0 = PROCUREMENT_DATA.shared_store.supplier_assignments["supplier_3"].quotation;
assert.strictEqual(q0.revision, "Rev 0");
assert.strictEqual(q0.freight_type, "per_mt");
assert.strictEqual(q0.freight_amount_per_mt, 1500);
assert.strictEqual(q0.freight_amount, 75000);
assert.strictEqual(q0.total_landed_amount, 1727000); // 14,00,000 + 2,52,000 + 75,000

let rep0 = PROCUREMENT_DATA.generateComparativeStatement(rfq.rfq_ref);
let s3_0 = rep0.columns.find(c => c.supplier_id === "supplier_3");
assert.strictEqual(s3_0.freight_amount, 75000);
assert.strictEqual(s3_0.freight_display, "INR 75,000.00");
assert.strictEqual(s3_0.total_landed_cost, 1727000);
console.log("  -> PASS: Rev 0 submitted: Freight ₹75,000 (₹1,500/MT), Total Landed INR 17,27,000.00");

// 2. Revise to Rev 1 with ₹1,000 lump sum (Option 1)
engine.handleSupplierAction("supplier_3", "btn_supp_revise_quote");
engine.handleSupplierAction("supplier_3", "btn_supp_edit_quote");
engine.handleSupplierAction("supplier_3", "btn_edit_q3");
engine.handleSupplierAction("supplier_3", "btn_q_freight_opt1"); // Freight charges ₹1,000
engine.handleSupplierAction("supplier_3", "btn_supp_confirm_submit");

let q1 = PROCUREMENT_DATA.shared_store.supplier_assignments["supplier_3"].quotation;
assert.strictEqual(q1.revision, "Rev 1");
assert.strictEqual(q1.freight_type, "lump_sum");
assert.strictEqual(q1.freight_amount, 1000);
assert.strictEqual(q1.freight_amount_per_mt, undefined, "Obsolete per-MT field MUST be deleted");
assert.strictEqual(q1.is_per_mt, false);
assert.strictEqual(q1.total_landed_amount, 1653000); // 14,00,000 + 2,52,000 + 1,000

let rep1 = PROCUREMENT_DATA.generateComparativeStatement(rfq.rfq_ref);
let s3_1 = rep1.columns.find(c => c.supplier_id === "supplier_3");
assert.strictEqual(s3_1.freight_amount, 1000);
assert.strictEqual(s3_1.freight_display, "INR 1,000.00");
assert.strictEqual(s3_1.total_landed_cost, 1653000);
assert.strictEqual(s3_1.normalized_landed_per_kg, 33.06);
console.log("  -> PASS: Rev 1 revised to ₹1,000 lump sum: Freight INR 1,000.00, Total Landed INR 16,53,000.00 (obsolete per-MT cleared)");

// 3. Revise BACK to Rev 2 with ₹1,500 per MT (Option 2)
engine.handleSupplierAction("supplier_3", "btn_supp_revise_quote");
engine.handleSupplierAction("supplier_3", "btn_supp_edit_quote");
engine.handleSupplierAction("supplier_3", "btn_edit_q3");
engine.handleSupplierAction("supplier_3", "btn_q_freight_opt2"); // ₹1,500 per MT
engine.handleSupplierAction("supplier_3", "btn_supp_confirm_submit");

let q2 = PROCUREMENT_DATA.shared_store.supplier_assignments["supplier_3"].quotation;
assert.strictEqual(q2.revision, "Rev 2");
assert.strictEqual(q2.freight_type, "per_mt");
assert.strictEqual(q2.freight_amount_per_mt, 1500);
assert.strictEqual(q2.freight_amount, 75000);
assert.strictEqual(q2.is_per_mt, true);
assert.strictEqual(q2.total_landed_amount, 1727000);

let rep2 = PROCUREMENT_DATA.generateComparativeStatement(rfq.rfq_ref);
let s3_2 = rep2.columns.find(c => c.supplier_id === "supplier_3");
assert.strictEqual(s3_2.freight_amount, 75000);
assert.strictEqual(s3_2.freight_display, "INR 75,000.00");
assert.strictEqual(s3_2.total_landed_cost, 1727000);
console.log("  -> PASS: Rev 2 revised BACK to ₹1,500/MT: Freight INR 75,000.00, Total Landed INR 17,27,000.00");

// 4. Revise to Rev 3 with ₹2,000 per MT (Option 3)
engine.handleSupplierAction("supplier_3", "btn_supp_revise_quote");
engine.handleSupplierAction("supplier_3", "btn_supp_edit_quote");
engine.handleSupplierAction("supplier_3", "btn_edit_q3");
engine.handleSupplierAction("supplier_3", "btn_q_freight_opt3"); // ₹2,000 per MT
engine.handleSupplierAction("supplier_3", "btn_supp_confirm_submit");

let q3 = PROCUREMENT_DATA.shared_store.supplier_assignments["supplier_3"].quotation;
assert.strictEqual(q3.revision, "Rev 3");
assert.strictEqual(q3.freight_type, "per_mt");
assert.strictEqual(q3.freight_amount_per_mt, 2000);
assert.strictEqual(q3.freight_amount, 100000);
assert.strictEqual(q3.is_per_mt, true);
assert.strictEqual(q3.total_landed_amount, 1752000); // 14,00,000 + 2,52,000 + 1,00,000

let rep3 = PROCUREMENT_DATA.generateComparativeStatement(rfq.rfq_ref);
let s3_3 = rep3.columns.find(c => c.supplier_id === "supplier_3");
assert.strictEqual(s3_3.freight_amount, 100000);
assert.strictEqual(s3_3.freight_display, "INR 1,00,000.00");
assert.strictEqual(s3_3.total_landed_cost, 1752000);
console.log("  -> PASS: Rev 3 revised to ₹2,000/MT: Freight INR 1,00,000.00, Total Landed INR 17,52,000.00");

// 5. Revise to Rev 4 with Freight Included (Option 4)
engine.handleSupplierAction("supplier_3", "btn_supp_revise_quote");
engine.handleSupplierAction("supplier_3", "btn_supp_edit_quote");
engine.handleSupplierAction("supplier_3", "btn_edit_q3");
engine.handleSupplierAction("supplier_3", "btn_q_freight_opt4"); // ₹0 (Freight included)
engine.handleSupplierAction("supplier_3", "btn_supp_confirm_submit");

let q4 = PROCUREMENT_DATA.shared_store.supplier_assignments["supplier_3"].quotation;
assert.strictEqual(q4.revision, "Rev 4");
assert.strictEqual(q4.freight_type, "included");
assert.strictEqual(q4.freight_amount, 0);
assert.strictEqual(q4.freight_amount_per_mt, undefined, "Obsolete per-MT must be deleted on included");
assert.strictEqual(q4.is_per_mt, false);
assert.strictEqual(q4.total_landed_amount, 1652000); // 14,00,000 + 2,52,000 + 0

let rep4 = PROCUREMENT_DATA.generateComparativeStatement(rfq.rfq_ref);
let s3_4 = rep4.columns.find(c => c.supplier_id === "supplier_3");
assert.strictEqual(s3_4.freight_amount, 0);
assert.strictEqual(s3_4.freight_display, "INR 0.00 (Included)");
assert.strictEqual(s3_4.total_landed_cost, 1652000);
console.log("  -> PASS: Rev 4 revised to Freight Included: Freight INR 0.00 (Included), Total Landed INR 16,52,000.00");

// 6. Revise to Rev 5 back to ₹1,000 lump sum (Option 1)
engine.handleSupplierAction("supplier_3", "btn_supp_revise_quote");
engine.handleSupplierAction("supplier_3", "btn_supp_edit_quote");
engine.handleSupplierAction("supplier_3", "btn_edit_q3");
engine.handleSupplierAction("supplier_3", "btn_q_freight_opt1"); // Freight charges ₹1,000
engine.handleSupplierAction("supplier_3", "btn_supp_confirm_submit");

let q5 = PROCUREMENT_DATA.shared_store.supplier_assignments["supplier_3"].quotation;
assert.strictEqual(q5.revision, "Rev 5");
assert.strictEqual(q5.freight_type, "lump_sum");
assert.strictEqual(q5.freight_amount, 1000);
assert.strictEqual(q5.freight_amount_per_mt, undefined);
assert.strictEqual(q5.is_per_mt, false);
assert.strictEqual(q5.total_landed_amount, 1653000);

let rep5 = PROCUREMENT_DATA.generateComparativeStatement(rfq.rfq_ref);
let s3_5 = rep5.columns.find(c => c.supplier_id === "supplier_3");
assert.strictEqual(s3_5.freight_amount, 1000);
assert.notStrictEqual(s3_5.freight_display, "INR 1,00,000.00");
assert.strictEqual(s3_5.freight_display, "INR 1,000.00");
assert.strictEqual(s3_5.total_landed_cost, 1653000);
assert.strictEqual(s3_5.normalized_landed_per_kg, 33.06);
console.log("  -> PASS: Rev 5 revised back to ₹1,000 lump sum: Freight INR 1,000.00, Total Landed INR 16,53,000.00, Landed/kg INR 33.06/kg");

console.log("\n======================================================================");
console.log("ALL FREIGHT PARSING, NORMALIZATION & REVISION TESTS PASSED (100% GREEN)!");
console.log("======================================================================");

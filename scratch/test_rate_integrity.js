/**
 * Test Suite: Quotation Rate Unit Conversion and Display Integrity
 * Verifies that:
 * 1. normalizeQuotationRates correctly parses MT and kg rates and avoids false matches from parenthetical conversions.
 * 2. buildPoObject sets correct line-item rate, item specification note, base subtotal, GST, freight, and total.
 * 3. Specific user record (50 MT @ ₹28,000/MT, GST 5%, Freight ₹1,000) yields ₹14,71,000 and "Indian Rupees Fourteen Lakh Seventy-One Thousand Only".
 * 4. Quotation in kg (e.g. ₹60/kg) yields rate ₹60,000/MT, specs "Quoted at ₹60/kg", and subtotal ₹30,00,000.
 * 5. Complete two-party workflow (Draft -> Buyer Signed -> Mutually Accepted) maintains financial integrity across all versions.
 */

const assert = require('assert');

// Mock browser environment
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

global.window = {
  PROCUREMENT_DATA: null,
  ProcurementEngine: null,
  documentModal: {
    showReportPreview: function(type, data) {
      this.lastType = type;
      this.lastData = data;
    }
  }
};

const PROCUREMENT_DATA = require("../js/data/procurement_data.js");
global.PROCUREMENT_DATA = PROCUREMENT_DATA;
global.window.PROCUREMENT_DATA = PROCUREMENT_DATA;

const ProcurementEngine = require("../js/engines/procurement_engine.js");
global.ProcurementEngine = ProcurementEngine;
global.window.ProcurementEngine = ProcurementEngine;

console.log("=== RUNNING RATE INTEGRITY & UNIT CONVERSION TESTS ===");

// -------------------------------------------------------------
// Test 1: normalizeQuotationRates unit conversion
// -------------------------------------------------------------
console.log("\n[Test 1] Testing normalizeQuotationRates logic...");

// 1a: Authoritative unit_rate_unit = "MT", display has parenthetical "(₹28 / kg)"
const quoteMt = {
  unit_rate_val: 28000,
  unit_rate_unit: "MT",
  unit_rate_display: "₹28,000 / MT (₹28 / kg)",
  gst_rate: 5,
  freight_amount: 1000
};
const normMt = PROCUREMENT_DATA.normalizeQuotationRates(quoteMt, 50, "MT");
assert.strictEqual(normMt.isQuotedInKg, false, "Should identify as MT quote");
assert.strictEqual(normMt.original_quoted_unit, "MT");
assert.strictEqual(normMt.original_quoted_rate, 28000);
assert.strictEqual(normMt.rate_per_mt, 28000);
assert.strictEqual(normMt.rate_per_kg, 28);
assert.strictEqual(normMt.rate_per_rfq_unit, 28000);
assert.strictEqual(normMt.base_amount, 1400000);
console.log("  ✓ 1a: Quote 28,000 MT parsed correctly: rate_per_mt=28000, rate_per_kg=28, base_amount=14,00,000");

// 1b: Authoritative unit_rate_unit = "kg", display has parenthetical "(₹60,000 / MT)"
const quoteKg = {
  unit_rate_val: 60,
  unit_rate_unit: "kg",
  unit_rate_display: "₹60 / kg (₹60,000 / MT)",
  gst_rate: 5,
  freight_amount: 2500
};
const normKg = PROCUREMENT_DATA.normalizeQuotationRates(quoteKg, 50, "MT");
assert.strictEqual(normKg.isQuotedInKg, true, "Should identify as kg quote");
assert.strictEqual(normKg.original_quoted_unit, "kg");
assert.strictEqual(normKg.original_quoted_rate, 60);
assert.strictEqual(normKg.rate_per_mt, 60000);
assert.strictEqual(normKg.rate_per_kg, 60);
assert.strictEqual(normKg.rate_per_rfq_unit, 60000);
assert.strictEqual(normKg.base_amount, 3000000);
console.log("  ✓ 1b: Quote 60 kg parsed correctly: rate_per_mt=60000, rate_per_kg=60, base_amount=30,00,000");

// 1c: Missing unit_rate_unit, inferred from display with parenthetical "(₹28 / kg)"
const quoteNoUnitDisp = {
  unit_rate_val: 28000,
  unit_rate_display: "₹28,000 / MT (₹28 / kg)"
};
const normNoUnitDisp = PROCUREMENT_DATA.normalizeQuotationRates(quoteNoUnitDisp, 50, "MT");
assert.strictEqual(normNoUnitDisp.isQuotedInKg, false, "Must not be tricked by (₹28 / kg) parenthetical");
assert.strictEqual(normNoUnitDisp.rate_per_mt, 28000);
assert.strictEqual(normNoUnitDisp.rate_per_kg, 28);
console.log("  ✓ 1c: Primary split ignores parenthetical conversion correctly");

// 1d: Natural fallback (onion threshold <= 500 is kg, > 500 is MT)
const quoteFallbackKg = { unit_price: 35 };
const normFallbackKg = PROCUREMENT_DATA.normalizeQuotationRates(quoteFallbackKg, 50, "MT");
assert.strictEqual(normFallbackKg.isQuotedInKg, true);
assert.strictEqual(normFallbackKg.rate_per_kg, 35);
assert.strictEqual(normFallbackKg.rate_per_mt, 35000);

const quoteFallbackMt = { unit_price: 35000 };
const normFallbackMt = PROCUREMENT_DATA.normalizeQuotationRates(quoteFallbackMt, 50, "MT");
assert.strictEqual(normFallbackMt.isQuotedInKg, false);
assert.strictEqual(normFallbackMt.rate_per_kg, 35);
assert.strictEqual(normFallbackMt.rate_per_mt, 35000);
console.log("  ✓ 1d: Natural fallback handles kg and MT thresholds accurately");

// -------------------------------------------------------------
// Test 2: Specific user test record financial calculations
// -------------------------------------------------------------
console.log("\n[Test 2] Testing specific user test record (50 MT @ ₹28,000/MT, GST 5%, Freight ₹1,000)...");

PROCUREMENT_DATA.shared_store.current_rfq = {
  rfq_ref: "PC-RFQ-2026-0007",
  material: "Onion",
  technical_specs: "Nashik Red Onion, Grade A (45-60mm)",
  quantity: 50.0,
  unit: "MT",
  hsn: "0703",
  delivery_location: "Apex Works, Hazira, Gujarat - 394270"
};

const poObj = PROCUREMENT_DATA.buildPoObject({
  po_ref: "PC-PO-2026-0007",
  supplier_id: "supp_001",
  supplier_name: "Ujjivan Farmers Agro Producer Co.",
  supplier_location: "Nashik, Maharashtra",
  quantity: 50.0,
  unit: "MT",
  unit_price: 28000,
  unit_rate_val: 28000,
  unit_rate_unit: "MT",
  unit_price_display: "₹28,000 / MT (₹28 / kg)",
  quoted_rate_display: "₹28,000 / MT (₹28 / kg)",
  gst_rate: 5,
  freight_amount: 1000,
  quotation_ref: "QT-2026-0042",
  quotation_date: "08/11/2026"
});

// Line item assertions
const item = poObj.line_items[0];
assert.strictEqual(item.quantity, 50.0);
assert.strictEqual(item.unit, "MT");
assert.strictEqual(item.unit_rate, 28000, "Line rate must be 28,000 per MT, NOT 2,80,00,000");
assert.strictEqual(item.base_total, 1400000, "Base total must be 14,00,000.00");
assert.ok(item.specs.includes("Quoted at ₹28/kg"), `Specs note must say 'Quoted at ₹28/kg', got: ${item.specs}`);
assert.ok(!item.specs.includes("Quoted at ₹28,000/kg"), "Specs note must NEVER say 'Quoted at ₹28,000/kg'");

// Financial summary assertions
assert.strictEqual(poObj.base_total, 1400000, "PO base_total must be 14,00,000");
assert.strictEqual(poObj.gst_rate, 5);
assert.strictEqual(poObj.gst_amount, 70000, "GST 5% must be 70,000");
assert.strictEqual(poObj.freight_total, 1000, "Freight must be 1,000");
assert.strictEqual(poObj.total_order_value_inr, 1471000, "Total PO value must be 14,71,000");
assert.strictEqual(poObj.amount_in_words, "Indian Rupees Fourteen Lakh Seventy-One Thousand Only", "Amount in words must match exactly");
console.log("  ✓ 2a: poObj financials match user specifications exactly");

// Document HTML assertions
const docHtml = poObj.document_html;
assert.ok(docHtml.includes("28,000.00"), "HTML table must show unit rate 28,000.00");
assert.ok(docHtml.includes("14,00,000.00"), "HTML table must show base total 14,00,000.00");
assert.ok(docHtml.includes("70,000.00"), "HTML table must show GST 70,000.00");
assert.ok(docHtml.includes("1,000.00"), "HTML table must show Freight 1,000.00");
assert.ok(docHtml.includes("14,71,000.00"), "HTML table must show Grand Total 14,71,000.00");
assert.ok(docHtml.includes("Indian Rupees Fourteen Lakh Seventy-One Thousand Only"), "HTML must contain amount in words");
assert.ok(docHtml.includes("Quoted at ₹28/kg"), "HTML specs note must contain Quoted at ₹28/kg");
assert.ok(!docHtml.includes("2,80,00,000"), "HTML must NOT contain 2,80,00,000");
assert.ok(!docHtml.includes("Quoted at ₹28,000/kg"), "HTML must NOT contain Quoted at ₹28,000/kg");
console.log("  ✓ 2b: Document HTML renders correct rate, specs, subtotals, and grand total");

// -------------------------------------------------------------
// Test 3: Consistency across draft, buyer_signed, and mutually_accepted versions
// -------------------------------------------------------------
console.log("\n[Test 3] Testing consistency across draft, buyer_signed, and mutually_accepted versions...");

const poCreated = PROCUREMENT_DATA.createPurchaseOrder({
  po_ref: "PC-PO-2026-0007",
  supplier_id: "supp_001",
  supplier_name: "Ujjivan Farmers Agro Producer Co.",
  supplier_location: "Nashik, Maharashtra",
  quantity: 50.0,
  unit: "MT",
  unit_price: 28000,
  unit_rate_val: 28000,
  unit_rate_unit: "MT",
  gst_rate: 5,
  freight_amount: 1000
});

// Draft version
assert.strictEqual(poCreated.document_version, "draft");
assert.ok(poCreated.document_html.includes("28,000.00"));
assert.ok(poCreated.document_html.includes("14,71,000.00"));

// Buyer signs
const poBuyerSigned = PROCUREMENT_DATA.recordBuyerPoSignOff("PC-PO-2026-0007", "R. K. Sharma");
assert.strictEqual(poBuyerSigned.document_version, "buyer_signed");
assert.strictEqual(poBuyerSigned.buyer_signatory_name, "R. K. Sharma");
assert.ok(poBuyerSigned.document_html.includes("28,000.00"));
assert.ok(poBuyerSigned.document_html.includes("14,71,000.00"));
assert.ok(poBuyerSigned.document_html.includes("Quoted at ₹28/kg"));
assert.ok(poBuyerSigned.document_html.includes("Signed: R. K. Sharma"));

// Supplier accepts
const poAccepted = PROCUREMENT_DATA.recordSupplierPoAcceptance("PC-PO-2026-0007", "supp_001", "Ujjivan Farmers Agro Producer Co.");
assert.strictEqual(poAccepted.document_version, "mutually_accepted");
assert.strictEqual(poAccepted.supplier_signatory_name, "Ujjivan Farmers Agro Producer Co.");
assert.ok(poAccepted.document_html.includes("28,000.00"));
assert.ok(poAccepted.document_html.includes("14,71,000.00"));
assert.ok(poAccepted.document_html.includes("Quoted at ₹28/kg"));
assert.ok(poAccepted.document_html.includes("Accepted: Ujjivan Farmers Agro Producer Co."));
assert.strictEqual(poAccepted.overall_status, "ACCEPTED_BY_BOTH_PARTIES");
console.log("  ✓ 3a: All document versions maintain identical rate and financial numbers");

// -------------------------------------------------------------
// Test 4: End-to-end ProcurementEngine flow
// -------------------------------------------------------------
console.log("\n[Test 4] Testing ProcurementEngine end-to-end flow...");

const engine = new ProcurementEngine();
engine.buyer_state.rfq_ref = "PC-RFQ-2026-0007";
engine.buyer_state.quantity = 50.0;
engine.buyer_state.unit = "MT";
engine.buyer_state.material = "Onion";
engine.buyer_state.technical_specs = "Nashik Red Onion, Grade A (45-60mm)";
engine.buyer_state.terms = {
  term_1: "50 MT Onion",
  term_2: "Hazira Works, Surat, Gujarat - 394270",
  term_3: "100% against delivery at destination",
  term_4: "Supplier scope (FOR Destination)",
  term_5: "Certificate of Analysis & Test Certificate",
  term_6: "7 days from receipt of RFQ",
  term_7: "Within 2 days of PO issuance",
  term_8: "5% GST extra as applicable"
};
engine.syncRfqStore();

// Setup supplier_3 quoting ₹28,000/MT (₹28/kg) with 5% GST and ₹1,000 freight
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

// Generate comparative statement
const compResult = engine.executeGenerateComparison();
const report = PROCUREMENT_DATA.shared_store.current_comparison;
assert.ok(report && report.columns.length > 0);
const col = report.columns.find(c => c.supplier_id === "supplier_3");
assert.ok(col, "Column for supplier_3 must exist");
assert.strictEqual(col.base_amount, 1400000);
assert.strictEqual(col.gst_amount, 70000);
assert.strictEqual(col.freight_amount, 1000);
assert.strictEqual(col.total_landed_cost, 1471000);

// Buyer selects supplier_3 for PO
engine.buyer_state.po_selected_supplier_id = "supplier_3";
engine.buyer_state.po_rfq_ref = "PC-RFQ-2026-0007";
engine.buyer_state.po_comparison_ref = report.comparison_ref;

const reviewPrompt = engine.renderPoReviewPrompt(engine.buyer_state, col, report);
assert.ok(reviewPrompt.text.includes("Base Subtotal:* INR 14,00,000.00"));
assert.ok(reviewPrompt.text.includes("GST (5%):* INR 70,000.00"));
assert.ok(reviewPrompt.text.includes("Freight Charges:* INR 1,000.00"));
assert.ok(reviewPrompt.text.includes("Total PO Value:* *INR 14,71,000.00*"));

const draftPo = engine.getOrCreateDraftPo();
assert.strictEqual(draftPo.line_items[0].unit_rate, 28000);
assert.strictEqual(draftPo.base_total, 1400000);
assert.strictEqual(draftPo.total_order_value_inr, 1471000);

const dispatchRes = engine.executePoDispatch();
assert.strictEqual(dispatchRes.step, "PO_DISPATCHED");
const currentPo = PROCUREMENT_DATA.shared_store.current_po;
assert.strictEqual(currentPo.line_items[0].unit_rate, 28000);
assert.strictEqual(currentPo.base_total, 1400000);
assert.strictEqual(currentPo.total_order_value_inr, 1471000);
assert.ok(currentPo.document_html.includes("28,000.00"));
assert.ok(currentPo.document_html.includes("Quoted at ₹28/kg"));
console.log("  ✓ 4a: End-to-end ProcurementEngine execution verified successfully");

console.log("\nALL RATE INTEGRITY TESTS PASSED SUCCESSFULLY! (100% GREEN)");

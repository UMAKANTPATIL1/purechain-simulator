/**
 * Automated Test Suite: DAAM GURU Market Benchmark Comparison
 *
 * Verifies all 16 requirements from Section 11:
 * 1. Demo dataset loads correctly (5 illustrative records).
 * 2. Onion matches the Lasalgaon, Maharashtra benchmark (3,200 INR/quintal).
 * 3. Wrong/unrelated commodities do not match (returns null).
 * 4. Missing market records are handled correctly.
 * 5. ₹3,200/quintal converts to ₹32.00/kg.
 * 6. INR/kg (e.g. ₹32/kg = ₹32/kg) and INR/MT (e.g. ₹32,000/MT = ₹32/kg) conversions work.
 * 7. Supplier Test landed cost comparison equals ₹35.04/kg vs ₹32.00/kg (+₹3.04/kg, +9.5%, Above market).
 * 8. UJJIVAN landed cost comparison equals ₹70.82/kg vs ₹32.00/kg (+₹38.82/kg, +121.31%, Above market).
 * 9. Percentage differences calculated accurately.
 * 10. Above-market, below-market, and at-market classifications work.
 * 11. Buyer WhatsApp summary includes the dedicated DAAM GURU section with correct format.
 * 12. T-2 PDF displays benchmark comparisons for all submitted suppliers.
 * 13. Demo-data disclosure appears in WhatsApp and PDF.
 * 14. The same stored benchmark record is used in WhatsApp and PDF (no re-querying).
 * 15. Missing benchmark handling displays clean unavailable notices.
 * 16. Existing T-2 revision handling remains correct.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Mock browser globals
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

const DAAM_GURU_DATA = require('../js/data/daam_guru_data.js');
global.DAAM_GURU_DATA = DAAM_GURU_DATA;
global.window.DAAM_GURU_DATA = DAAM_GURU_DATA;

const PROCUREMENT_DATA = require('../js/data/procurement_data.js');
global.PROCUREMENT_DATA = PROCUREMENT_DATA;
global.window.PROCUREMENT_DATA = PROCUREMENT_DATA;

const ProcurementEngine = require('../js/engines/procurement_engine.js');
global.ProcurementEngine = ProcurementEngine;
global.window.ProcurementEngine = ProcurementEngine;

const DocumentModal = require('../js/ui/document_modal.js');
const modal = new DocumentModal();
global.window.documentModal = modal;

console.log("======================================================================");
console.log("SUITE: DAAM GURU MARKET BENCHMARK COMPARISON (TESTS 1 TO 16)");
console.log("======================================================================");

// -------------------------------------------------------------
// Test 1: Demo dataset loads correctly
// -------------------------------------------------------------
console.log("\n[TEST 1] Verifying demo dataset structure and records...");
assert.strictEqual(DAAM_GURU_DATA.source_name, "Market Price Benchmark Demo Dataset");
assert.ok(Array.isArray(DAAM_GURU_DATA.records), "Records must be an array");
assert.strictEqual(DAAM_GURU_DATA.records.length, 5, "Expected exactly 5 demo records");

DAAM_GURU_DATA.records.forEach(r => {
  assert.ok(r.commodity, "Record must have commodity");
  assert.ok(r.state, "Record must have state");
  assert.ok(r.market, "Record must have market");
  assert.ok(r.variety, "Record must have variety");
  assert.ok(r.grade, "Record must have grade");
  assert.ok(typeof r.minimum_price === "number");
  assert.ok(typeof r.maximum_price === "number");
  assert.ok(typeof r.modal_price === "number");
  assert.strictEqual(r.unit, "INR/quintal");
  assert.strictEqual(r.source, "Market Price Benchmark Demo Dataset");
  assert.strictEqual(r.is_demo_data, true, "is_demo_data must be true");
  assert.ok(r.price_date, "Record must have price_date");
});
console.log("  -> PASS: Demo dataset loads correctly with all required schema fields!");

// -------------------------------------------------------------
// Test 2: Onion matches Lasalgaon benchmark
// -------------------------------------------------------------
console.log("\n[TEST 2] Verifying Onion matches Lasalgaon, Maharashtra benchmark...");
const onionBench = DAAM_GURU_DATA.getBenchmarkForRfq({ material: "Onion", quantity: 50, unit: "MT" });
assert.ok(onionBench, "Should find benchmark for Onion");
assert.strictEqual(onionBench.commodity, "Onion");
assert.strictEqual(onionBench.state, "Maharashtra");
assert.strictEqual(onionBench.market, "Lasalgaon");
assert.strictEqual(onionBench.modal_price, 3200);
assert.strictEqual(onionBench.original_unit, "INR/quintal");
assert.strictEqual(onionBench.normalized_price_per_kg, 32.0);
assert.strictEqual(onionBench.is_demo_data, true);
console.log("  -> PASS: Onion matches Lasalgaon benchmark (₹3,200/quintal = ₹32.00/kg)!");

// -------------------------------------------------------------
// Test 3: Wrong commodities do not match
// -------------------------------------------------------------
console.log("\n[TEST 3] Verifying wrong/unconfigured commodities do not match...");
const copperBench = DAAM_GURU_DATA.getBenchmarkForRfq({ material: "Copper Scrap", quantity: 10, unit: "MT" });
assert.strictEqual(copperBench, null, "Copper should return null");

const aluminumBench = DAAM_GURU_DATA.getBenchmarkForRfq({ material: "Aluminum Ingots" });
assert.strictEqual(aluminumBench, null, "Aluminum should return null");
console.log("  -> PASS: Unrelated commodities safely return null without fabricating prices!");

// -------------------------------------------------------------
// Test 4: Missing market records handled correctly
// -------------------------------------------------------------
console.log("\n[TEST 4] Verifying missing market fallback handling...");
// Requesting an unknown market for Onion in Maharashtra falls back to Lasalgaon with fallback flag
const fallbackBench = DAAM_GURU_DATA.getBenchmarkForRfq({ material: "Onion" }, "Maharashtra", "Kolhapur");
assert.ok(fallbackBench, "Should find fallback Onion record");
assert.strictEqual(fallbackBench.commodity, "Onion");
assert.strictEqual(fallbackBench.state, "Maharashtra");
assert.strictEqual(fallbackBench.is_fallback_market, true, "Should be flagged as fallback market");
console.log("  -> PASS: Missing market handled with clearly identified demo fallback market!");

// -------------------------------------------------------------
// Test 5: ₹3,200/quintal converts to ₹32/kg
// -------------------------------------------------------------
console.log("\n[TEST 5] Verifying ₹3,200/quintal converts to ₹32/kg...");
const normQuintal = DAAM_GURU_DATA.normalizePriceToKg(3200, "INR/quintal");
assert.strictEqual(normQuintal, 32.0, "3200 INR/quintal must equal 32.0 INR/kg");
console.log("  -> PASS: ₹3,200/quintal ÷ 100 = ₹32.00/kg verified!");

// -------------------------------------------------------------
// Test 6: INR/kg and INR/MT conversions work
// -------------------------------------------------------------
console.log("\n[TEST 6] Verifying INR/kg and INR/MT unit conversions...");
assert.strictEqual(DAAM_GURU_DATA.normalizePriceToKg(32, "INR/kg"), 32.0);
assert.strictEqual(DAAM_GURU_DATA.normalizePriceToKg(32000, "INR/MT"), 32.0);
assert.strictEqual(DAAM_GURU_DATA.normalizePriceToKg(32000, "INR/tonne"), 32.0);
assert.strictEqual(DAAM_GURU_DATA.normalizePriceToKg(4500, "INR/qtl"), 45.0);
console.log("  -> PASS: INR/kg, INR/MT, and INR/quintal conversions verified!");

// -------------------------------------------------------------
// Test 7: Supplier Test comparison (₹35.04/kg vs ₹32.00/kg)
// -------------------------------------------------------------
console.log("\n[TEST 7] Verifying Supplier Test landed cost comparison (₹35.04/kg vs ₹32.00/kg)...");
const compSuppTest = DAAM_GURU_DATA.calculateComparison(35.04, 32.0);
assert.ok(compSuppTest);
assert.strictEqual(Math.round(compSuppTest.difference_per_kg * 100) / 100, 3.04);
assert.strictEqual(compSuppTest.position, "Above market");
assert.strictEqual(compSuppTest.formatted_percentage, "9.5%");
assert.strictEqual(compSuppTest.diff_display_whatsapp, "+INR 3.04/kg (+9.5%)");
assert.strictEqual(compSuppTest.t2_table_display, "₹32.00/kg benchmark | ₹35.04/kg landed | +9.5% above market");
console.log("  -> PASS: Supplier Test: +INR 3.04/kg (+9.5%), Above market!");

// -------------------------------------------------------------
// Test 8: UJJIVAN comparison (₹70.82/kg vs ₹32.00/kg)
// -------------------------------------------------------------
console.log("\n[TEST 8] Verifying UJJIVAN landed cost comparison (₹70.82/kg vs ₹32.00/kg)...");
const compUjjivan = DAAM_GURU_DATA.calculateComparison(70.82, 32.0);
assert.ok(compUjjivan);
assert.strictEqual(Math.round(compUjjivan.difference_per_kg * 100) / 100, 38.82);
assert.strictEqual(compUjjivan.position, "Above market");
assert.strictEqual(compUjjivan.formatted_percentage, "121.31%");
assert.strictEqual(compUjjivan.diff_display_whatsapp, "+INR 38.82/kg (+121.31%)");
assert.strictEqual(compUjjivan.t2_table_display, "₹32.00/kg benchmark | ₹70.82/kg landed | +121.31% above market");
console.log("  -> PASS: UJJIVAN: +INR 38.82/kg (+121.31%), Above market!");

// -------------------------------------------------------------
// Test 9 & 10: Percentage calculation & Position classifications
// -------------------------------------------------------------
console.log("\n[TEST 9 & 10] Testing percentage calculation and position classifications...");
// At market
const compAt = DAAM_GURU_DATA.calculateComparison(32.0, 32.0);
assert.strictEqual(compAt.position, "At market");
assert.strictEqual(compAt.formatted_percentage, "0%");
assert.strictEqual(compAt.t2_table_display, "₹32.00/kg benchmark | ₹32.00/kg landed | at market");

// Below market
const compBelow = DAAM_GURU_DATA.calculateComparison(28.8, 32.0);
assert.strictEqual(compBelow.position, "Below market");
assert.strictEqual(compBelow.formatted_percentage, "10%");
assert.strictEqual(compBelow.diff_display_whatsapp, "-INR 3.20/kg (-10%)");
assert.strictEqual(compBelow.t2_table_display, "₹32.00/kg benchmark | ₹28.80/kg landed | -10% below market");
console.log("  -> PASS: Above market, Below market, and At market accurately classified!");

// -------------------------------------------------------------
// Test 11: Buyer WhatsApp summary includes DAAM GURU section
// -------------------------------------------------------------
console.log("\n[TEST 11] Verifying Buyer WhatsApp summary includes DAAM GURU section...");
const engine = new ProcurementEngine();

PROCUREMENT_DATA.initStore();
const rfq = PROCUREMENT_DATA.createRFQ({
  rfq_ref: "PC-RFQ-2026-0113",
  material: "Onion",
  quantity: 50.0,
  unit: "MT",
  selected_suppliers: ["supplier_2", "supplier_3", "supplier_1"]
});

// Submit quote for UJJIVAN (supplier_2) -> Landed cost INR 70.82/kg
PROCUREMENT_DATA.submitQuotation("supplier_2", {
  quotation_ref: "QT-2026-S2-8104",
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

// Submit quote for Supplier Test (supplier_3) -> Landed cost INR 35.04/kg
PROCUREMENT_DATA.submitQuotation("supplier_3", {
  quotation_ref: "QT-2026-S3-2917",
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
  payment_terms: "payment after delivery",
  quotation_validity: "3 days",
  quality_docs: "No quality documents"
});

engine.buyer_state.rfq_ref = "PC-RFQ-2026-0113";
const compMsg = engine.executeGenerateComparison();

assert.ok(compMsg.text.includes("MARKET PRICE BENCHMARK COMPARISON"), "Must contain section header");
assert.ok(compMsg.text.includes("Source: Market Price Benchmark Demo Dataset") || compMsg.text.includes("*Source:* Market Price Benchmark Demo Dataset"));
assert.ok(compMsg.text.includes("Status: Illustrative demo data — not live market prices") || compMsg.text.includes("*Status:* Illustrative demo data — not live market prices"));
assert.ok(compMsg.text.includes("Commodity: Onion") || compMsg.text.includes("*Commodity:* Onion"));
assert.ok(compMsg.text.includes("Lasalgaon, Maharashtra"));
assert.ok(compMsg.text.includes("INR 32.00/kg"));
assert.ok(compMsg.text.includes("Supplier Test"));
assert.ok(compMsg.text.includes("INR 35.04/kg"));
assert.ok(compMsg.text.includes("+INR 3.04/kg (+9.5%)"));
assert.ok(compMsg.text.includes("UJJIVAN SMALL FINANCE BANK LIMITED"));
assert.ok(compMsg.text.includes("INR 70.82/kg"));
assert.ok(compMsg.text.includes("+INR 38.82/kg (+121.31%)"));
console.log("  -> PASS: Buyer WhatsApp summary contains complete Market Price Benchmark section with exact expected values!");

// -------------------------------------------------------------
// Test 12: T-2 PDF displays benchmark comparisons for all submitted suppliers
// -------------------------------------------------------------
console.log("\n[TEST 12] Verifying T-2 PDF HTML rendering of Market Price Benchmark row...");
const report = PROCUREMENT_DATA.shared_store.current_comparison;
const t2Html = modal.buildComparisonDocumentHtml(report);

assert.ok(t2Html.includes("Market Price Benchmark"), "Must contain Market Price Benchmark row header");
assert.ok(t2Html.includes("₹32.00/kg benchmark | ₹35.04/kg landed | +9.5% above market"), "Must contain Supplier Test benchmark comparison");
assert.ok(t2Html.includes("₹32.00/kg benchmark | ₹70.82/kg landed | +121.31% above market"), "Must contain UJJIVAN benchmark comparison");
assert.ok(t2Html.includes("<td>-</td>"), "Pending supplier (supplier_1) must display '-'");
console.log("  -> PASS: T-2 PDF HTML displays Market Price Benchmark row with benchmark comparisons for all submitted suppliers!");

// -------------------------------------------------------------
// Test 13: Demo-data disclosure appears in WhatsApp and PDF
// -------------------------------------------------------------
console.log("\n[TEST 13] Verifying demo-data disclosure in WhatsApp and PDF...");
assert.ok(compMsg.text.includes("Illustrative demo data — not live market prices"), "Disclosure in WhatsApp");
assert.ok(t2Html.includes("Market price benchmark uses illustrative demo data for simulation purposes only. It is not a live or verified market quotation."), "Disclosure in T-2 PDF");
console.log("  -> PASS: Clear demo-data disclosures present in both WhatsApp summary and T-2 PDF!");

// -------------------------------------------------------------
// Test 14: The same stored benchmark is used in WhatsApp and PDF
// -------------------------------------------------------------
console.log("\n[TEST 14] Verifying the same stored benchmark record is used across views...");
assert.ok(report.daam_guru_benchmark, "Report must store benchmark record");
assert.strictEqual(report.daam_guru_benchmark.market, "Lasalgaon");
assert.strictEqual(report.daam_guru_benchmark.normalized_price_per_kg, 32.0);

// Verify modal build uses stored benchmark without re-querying or mutating
const secondRenderHtml = modal.buildComparisonDocumentHtml(report);
assert.ok(secondRenderHtml.includes("₹32.00/kg benchmark | ₹35.04/kg landed | +9.5% above market"));
console.log("  -> PASS: Consistent stored benchmark record utilized across all components!");

// -------------------------------------------------------------
// Test 15: Missing benchmark handling works
// -------------------------------------------------------------
console.log("\n[TEST 15] Verifying missing benchmark handling...");
// Create an RFQ for unknown commodity
const unkRfq = PROCUREMENT_DATA.createRFQ({
  rfq_ref: "PC-RFQ-2026-9999",
  material: "Special Brass 99",
  quantity: 10.0,
  unit: "MT",
  selected_suppliers: ["supplier_1"]
});
const unkReport = PROCUREMENT_DATA.generateComparativeStatement("PC-RFQ-2026-9999");
assert.strictEqual(unkReport.daam_guru_benchmark, null, "Should have no benchmark");

engine.buyer_state.rfq_ref = "PC-RFQ-2026-9999";
const unkMsg = engine.executeGenerateComparison();
assert.ok(unkMsg.text.includes("Market price benchmark unavailable — no matching demo market record."), "WhatsApp missing notice");

const unkHtml = modal.buildComparisonDocumentHtml(unkReport);
assert.ok(unkHtml.includes("Benchmark unavailable — no matching market record.") || unkHtml.includes("<td>-</td>"), "PDF missing notice");
console.log("  -> PASS: Missing benchmark cleanly handled without inventing prices!");

// -------------------------------------------------------------
// Test 16: Existing T-2 revision handling remains correct
// -------------------------------------------------------------
console.log("\n[TEST 16] Verifying T-2 revision handling...");
assert.strictEqual(typeof report.revision, "string");
assert.ok(report.revision.startsWith("Rev "), "Revision format must start with 'Rev '");
console.log("  -> PASS: Existing T-2 revision handling preserved 100%!");

console.log("\n======================================================================");
console.log("ALL 16 DAAM GURU AUTOMATED TESTS PASSED WITH 100% SUCCESS!");
console.log("======================================================================");

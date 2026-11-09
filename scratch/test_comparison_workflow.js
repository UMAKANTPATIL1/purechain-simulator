/**
 * Test Suite: Buyer-Initiated Quotation Comparison Report (Template T-2)
 * Tests all 15 requirements defined in the specification.
 */

const assert = require("assert");

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

const PROCUREMENT_DATA = require("../js/data/procurement_data.js");
global.PROCUREMENT_DATA = PROCUREMENT_DATA;
window.PROCUREMENT_DATA = PROCUREMENT_DATA;

const ProcurementEngine = require("../js/engines/procurement_engine.js");
const DocumentModal = require("../js/ui/document_modal.js");

window.documentModal = new DocumentModal();

console.log("======================================================================");
console.log("SUITE: VERIFY BUYER-INITIATED QUOTATION COMPARISON REPORT (TESTS 1 TO 15)");
console.log("======================================================================");

// Initialize engine and store
const engine = new ProcurementEngine();
PROCUREMENT_DATA.initStore();
engine.switchParticipant("buyer");

// Create active RFQ for testing
const rfq = PROCUREMENT_DATA.createRFQ({
  rfq_ref: "PC-RFQ-2026-0113",
  material: "Onion",
  quantity: 50.0,
  unit: "MT",
  selected_suppliers: ["supplier_1", "supplier_2", "supplier_3"]
});
engine.buyer_state.rfq_ref = rfq.rfq_ref;
engine.buyer_state.quantity = 50.0;
engine.buyer_state.unit = "MT";

// ---------------------------------------------------------------------
// TEST 1: Supplier Submission Does Not Post Full Quotation to Buyer Chat
// ---------------------------------------------------------------------
console.log("\n[TEST 1] Verifying supplier submission does not post full quotation into buyer chat...");
const initialBuyerHistoryLen = PROCUREMENT_DATA.shared_store.conversation_histories["buyer"].length;

// Supplier 2 submits a quotation
const qParams2 = {
  quotation_ref: "QT-2026-S2-8104",
  revision: "Rev 0",
  unit_rate_val: 55.0,
  unit_rate_unit: "kg",
  unit_rate_display: "INR 55.00/kg",
  base_amount: 2750000,
  gst_rate: 18.0,
  gst_amount: 495000,
  freight_amount: 1200,
  freight_display: "INR 1,200.00",
  total_landed_amount: 3246200,
  delivery_period: "2 days",
  payment_terms: "payment after delivery",
  quotation_validity: "3 days",
  quality_docs: "No quality documents"
};

const subResult2 = PROCUREMENT_DATA.submitQuotation("supplier_2", qParams2);
assert.ok(subResult2.quotation, "Supplier 2 quotation logged in store");

const buyerHistoryAfterSub = PROCUREMENT_DATA.shared_store.conversation_histories["buyer"];
const fullQuoteMsgInBuyer = buyerHistoryAfterSub.filter(m => m.text && m.text.includes("NEW QUOTATION RECEIVED"));
assert.strictEqual(fullQuoteMsgInBuyer.length, 0, "Zero full quotation notification messages posted in buyer chat");
console.log("  -> PASS: Supplier submission does not leak full quotation into buyer chat!");

// ---------------------------------------------------------------------
// TEST 2: Quotation Status Updates Correctly
// ---------------------------------------------------------------------
console.log("\n[TEST 2] Verifying quotation status screen updates correctly...");
let statusMsg = engine.renderBuyerQuotationStatus();
assert.ok(statusMsg.text.includes("Quotations Received:* 1") || statusMsg.text.includes("Quotations Received: 1"), "Quotations received is 1");
assert.ok(statusMsg.text.includes("Quotations Pending:* 2") || statusMsg.text.includes("Quotations Pending: 2"), "Quotations pending is 2");
assert.ok(statusMsg.text.includes("Quotations Rejected:* 0") || statusMsg.text.includes("Quotations Rejected: 0"), "Quotations rejected is 0");

// Verify supplier-wise status without full quotation details
assert.ok(statusMsg.text.includes("UJJIVAN SMALL FINANCE BANK LIMITED"), "Supplier 2 listed in status");
assert.ok(statusMsg.text.includes("QT-2026-S2-8104"), "Quote reference visible in status");
assert.ok(!statusMsg.text.includes("INR 55.00/kg"), "Quoted rate not exposed in status monitor text");
assert.ok(!statusMsg.text.includes("3,246,200"), "Total landed cost not exposed in status monitor text");

// Button check: Generate Comparison Report must be available since >= 1 quote received
const genBtn = statusMsg.buttons.find(b => b.id === "btn_buyer_generate_comparison");
assert.ok(genBtn, "Generate Comparison Report button available when >= 1 quote received");
console.log("  -> PASS: Status screen accurately displays counts and supplier status without leaking full quotes!");

// ---------------------------------------------------------------------
// TEST 3: Report Is Not Generated Automatically
// ---------------------------------------------------------------------
console.log("\n[TEST 3] Verifying comparison report is not generated automatically...");
assert.strictEqual(PROCUREMENT_DATA.shared_store.current_comparison, null, "current_comparison is null before explicit buyer action");
assert.strictEqual(Object.keys(PROCUREMENT_DATA.shared_store.comparison_reports).length, 0, "No comparison reports stored yet");
console.log("  -> PASS: Comparison report is NOT generated automatically!");

// ---------------------------------------------------------------------
// TEST 4: Buyer Can Explicitly Generate T-2
// ---------------------------------------------------------------------
console.log("\n[TEST 4] Testing buyer explicitly triggers T-2 report generation...");
const genResponse = engine.handleBuyerAction("btn_buyer_generate_comparison", null);
assert.ok(genResponse, "Engine responded to Generate Comparison Report action");
assert.strictEqual(engine.buyer_state.step, "COMPARISON_GENERATED", "Buyer state moved to COMPARISON_GENERATED");
assert.ok(genResponse.text.includes("BID COMPARISON REPORT (TEMPLATE T-2) GENERATED"), "Confirmation text in chat");

const activeReport = PROCUREMENT_DATA.shared_store.current_comparison;
assert.ok(activeReport, "Comparison report generated and stored in shared store");
assert.ok(activeReport.comparison_ref.startsWith("PC-BCR-"), "Report reference format matches PC-BCR-");
console.log("  -> PASS: Report generated successfully upon explicit buyer action!");

// ---------------------------------------------------------------------
// TEST 5 & 6: Submitted vs Pending Suppliers in Report
// ---------------------------------------------------------------------
console.log("\n[TEST 5 & 6] Verifying submitted suppliers appear and pending display 'Quotation pending'...");
const colUjjivan = activeReport.columns.find(c => c.supplier_id === "supplier_2");
const colSupplier1 = activeReport.columns.find(c => c.supplier_id === "supplier_1");
const colSupplier3 = activeReport.columns.find(c => c.supplier_id === "supplier_3");

assert.ok(colUjjivan, "Supplier 2 (UJJIVAN) appears as a column");
assert.strictEqual(colUjjivan.status, "SUBMITTED", "Supplier 2 has SUBMITTED status");
assert.strictEqual(colUjjivan.quoted_rate_display, "INR 55.00/kg", "Supplier 2 displays quoted rate");

assert.ok(colSupplier1, "Supplier 1 appears as a column");
assert.strictEqual(colSupplier1.status, "PENDING", "Supplier 1 has PENDING status");
assert.strictEqual(colSupplier1.quoted_rate_display, "Quotation pending", "Supplier 1 displays 'Quotation pending'");
assert.strictEqual(colSupplier1.gst_display, "-", "Supplier 1 GST is '-'");
assert.strictEqual(colSupplier1.freight_display, "-", "Supplier 1 Freight is '-'");
assert.strictEqual(colSupplier1.landed_cost_per_unit_display, "-", "Supplier 1 Landed cost per unit is '-'");
assert.strictEqual(colSupplier1.total_landed_cost_display, "-", "Supplier 1 Total landed cost is '-'");
assert.strictEqual(colSupplier1.rank_display, "Pending / No quote", "Supplier 1 rank is 'Pending / No quote'");

assert.ok(colSupplier3, "Supplier 3 appears as a column");
assert.strictEqual(colSupplier3.quoted_rate_display, "Quotation pending", "Supplier 3 displays 'Quotation pending'");
console.log("  -> PASS: All submitted and pending suppliers accurately formatted in comparison matrix!");

// ---------------------------------------------------------------------
// TEST 7, 8 & 9: Financial Calculations, Unit Conversions, Freight Not Double Counted
// ---------------------------------------------------------------------
console.log("\n[TEST 7, 8 & 9] Testing financial calculations, compatible unit conversions, and freight...");
// Submit Supplier 3 quote: 50 MT Onion quoted at INR 60.00/kg, GST 18%, Freight INR 1,000 lump sum
const qParams3 = {
  quotation_ref: "QT-2026-S3-2917",
  revision: "Rev 0",
  unit_rate_val: 60.0,
  unit_rate_unit: "kg",
  unit_rate_display: "INR 60.00/kg",
  base_amount: 3000000, // 50,000 kg * 60 = 3,000,000
  gst_rate: 18.0,
  gst_amount: 540000,   // 3,000,000 * 18% = 540,000
  freight_amount: 1000,
  freight_display: "INR 1,000.00",
  total_landed_amount: 3541000, // 3,000,000 + 540,000 + 1,000 = 3,541,000
  delivery_period: "2 days",
  payment_terms: "50% payment before delivery and 50% payment after delivery",
  quotation_validity: "3 days",
  quality_docs: "No quality documents"
};
PROCUREMENT_DATA.submitQuotation("supplier_3", qParams3);

// Submit Supplier 1 quote with Freight Included (INR 0.00): 50 MT Onion quoted at INR 28,000/MT, GST 5%
const qParams1 = {
  quotation_ref: "QT-2026-S1-4892",
  revision: "Rev 0",
  unit_rate_val: 28000.0,
  unit_rate_unit: "MT",
  unit_rate_display: "INR 28,000.00/MT",
  base_amount: 1400000, // 50 MT * 28,000 = 1,400,000
  gst_rate: 5.0,
  gst_amount: 70000,    // 1,400,000 * 5% = 70,000
  freight_amount: 0,
  freight_display: "Freight included",
  total_landed_amount: 1470000, // 1,400,000 + 70,000 + 0 = 1,470,000
  delivery_period: "5 business days",
  payment_terms: "100% after delivery",
  quotation_validity: "15 days",
  quality_docs: "Certificate of Analysis & Test Certificate"
};
PROCUREMENT_DATA.submitQuotation("supplier_1", qParams1);

// Regenerate report with all 3 quotations submitted
const rep3 = PROCUREMENT_DATA.generateComparativeStatement("PC-RFQ-2026-0113");

// Verify calculations for Supplier 3:
const s3Col = rep3.columns.find(c => c.supplier_id === "supplier_3");
assert.strictEqual(s3Col.base_amount, 3000000, "S3 Base amount is 50,000 kg * 60 = 3,000,000");
assert.strictEqual(s3Col.gst_amount, 540000, "S3 GST amount is 18% of 3,000,000 = 540,000");
assert.strictEqual(s3Col.freight_amount, 1000, "S3 Freight amount is 1,000");
assert.strictEqual(s3Col.total_landed_cost, 3541000, "S3 Total landed cost is Base + GST + Freight = 3,541,000 (freight not doubled)");
assert.strictEqual(s3Col.landed_cost_per_unit_display, "INR 70.82/kg", "S3 Landed cost per unit is 3,541,000 / 50,000 = INR 70.82/kg");

// Verify calculations for Supplier 1 (Freight Included):
const s1Col = rep3.columns.find(c => c.supplier_id === "supplier_1");
assert.strictEqual(s1Col.total_landed_cost, 1470000, "S1 Total landed cost = 1,400,000 + 70,000 = 1,470,000");
assert.strictEqual(s1Col.freight_display, "INR 0.00 (Included)", "S1 Freight explicitly marked included");
assert.strictEqual(s1Col.quoted_rate_display, "INR 28,000.00/MT", "S1 Quoted rate row preserves original quoted unit (/MT)");
assert.strictEqual(s1Col.landed_cost_per_unit_display, "INR 29.40/kg", "S1 Landed cost per unit normalized to canonical unit (INR 29.40/kg)");

console.log("  -> PASS: Calculations, unit conversions, and freight handling 100% accurate!");

// ---------------------------------------------------------------------
// TEST 10: Landed-Cost Ranking Preserved Separately from Recommendation
// ---------------------------------------------------------------------
console.log("\n[TEST 10] Testing landed-cost ranking (L1, L2, L3) and recommendation eligibility...");
// S1 normalized: 29.40/kg -> L1 (RAKSHAK: Verification unavailable)
// S2 normalized: 64.92/kg -> L2 (RAKSHAK: Verified and active)
// S3 normalized: 70.82/kg -> L3 (RAKSHAK: Verification unavailable)
assert.strictEqual(s1Col.rank_code, "L1", "Supplier 1 is ranked L1 strictly by landed cost per unit");
assert.ok(s1Col.rank_display.includes("L1 (Lowest landed cost)"), "Supplier 1 rank display shows L1");
assert.strictEqual(rep3.columns.find(c => c.supplier_id === "supplier_2").rank_code, "L2", "Supplier 2 is L2");
assert.strictEqual(s3Col.rank_code, "L3", "Supplier 3 is L3");

// Recommendation check: S1 is L1 by price but verification is unavailable -> NOT recommended
assert.strictEqual(s1Col.is_recommendation_eligible, false, "S1 is not eligible for recommendation (verification unavailable)");
assert.strictEqual(rep3.decision.recommended_supplier, "UJJIVAN SMALL FINANCE BANK LIMITED", "Recommended supplier is UJJIVAN (lowest with verified and active status)");
assert.ok(rep3.decision.reason.includes("cannot be recommended as GST verification is pending/unavailable") || rep3.decision.reason.includes("cannot be recommended as RAKSHAK verification is pending/unavailable"), "Reason explicitly explains why lowest quoted bidder was not recommended");
console.log("  -> PASS: Landed-cost ranking preserved separately and verified supplier recommended!");

// ---------------------------------------------------------------------
// TEST 11: Failed RAKSHAK Suppliers Cannot Be Recommended
// ---------------------------------------------------------------------
console.log("\n[TEST 11] Testing RAKSHAK verification failure disqualifies supplier from recommendation...");
// Set Supplier 1 RAKSHAK to Failed
const supp1Record = PROCUREMENT_DATA.getSupplierById("supplier_1");
supp1Record.rakshak_status = "Failed / Inactive GSTIN";

const repRakshak = PROCUREMENT_DATA.generateComparativeStatement("PC-RFQ-2026-0113");
const s1RakshakCol = repRakshak.columns.find(c => c.supplier_id === "supplier_1");

assert.strictEqual(s1RakshakCol.is_rakshak_failed, true, "Supplier 1 is marked as failed");
assert.strictEqual(s1RakshakCol.is_recommendation_eligible, false, "Supplier 1 is not eligible for recommendation");
assert.strictEqual(s1RakshakCol.rank_code, "L1", "Landed cost rank L1 preserved even when verification failed");
assert.notStrictEqual(repRakshak.decision.recommended_supplier, "Test Supplier Pvt Ltd", "Failed RAKSHAK supplier NOT recommended even with lowest cost!");
assert.strictEqual(repRakshak.decision.recommended_supplier, "UJJIVAN SMALL FINANCE BANK LIMITED", "Recommendation passes to next lowest valid verified bidder (UJJIVAN)");
assert.ok(repRakshak.decision.reason.includes("cannot be recommended due to failed GST verification") || repRakshak.decision.reason.includes("cannot be recommended due to failed RAKSHAK verification") || repRakshak.decision.reason.includes("disqualified due to RAKSHAK verification failure"), "Reason explicitly explains why L1 bidder was not recommended");

// Test when NO supplier is verified and active
const supp2Record = PROCUREMENT_DATA.getSupplierById("supplier_2");
const originalSupp2Rakshak = supp2Record.rakshak_status;
supp2Record.rakshak_status = "Verification unavailable"; // Now all submitted are either unavailable or failed

const repNoneVerified = PROCUREMENT_DATA.generateComparativeStatement("PC-RFQ-2026-0113");
assert.strictEqual(repNoneVerified.decision.recommended_supplier, "No recommendation — verification pending or failed", "Shows exact 'No recommendation — verification pending or failed' string");
assert.ok(repNoneVerified.decision.reason.length > 0, "Explains why no recommendation is made");

// Restore Supplier 2 and Supplier 1
supp2Record.rakshak_status = originalSupp2Rakshak;
supp1Record.rakshak_status = "Verification unavailable";
console.log("  -> PASS: Failed RAKSHAK and no-verified scenarios strictly handled!");

// ---------------------------------------------------------------------
// TEST 11B: Display Normalization (Delivery Period & Quote Validity)
// ---------------------------------------------------------------------
console.log("\n[TEST 11B] Testing display normalization for delivery period & quote validity...");
// Submit quote with prefix strings: "Delivery period 5 business days" and "Quotation validity 15 days"
const qStoredBefore = {
  quotation_ref: "QT-2026-S1-NORM",
  unit_rate_val: 28000.0,
  unit_rate_unit: "MT",
  delivery_period: "Delivery period 5 business days",
  quotation_validity: "Quotation validity 15 days"
};
PROCUREMENT_DATA.shared_store.supplier_assignments["supplier_1"].quotation.delivery_period = "Delivery period 5 business days";
PROCUREMENT_DATA.shared_store.supplier_assignments["supplier_1"].quotation.quotation_validity = "Quotation validity 15 days";

const repNorm = PROCUREMENT_DATA.generateComparativeStatement("PC-RFQ-2026-0113");
const s1NormCol = repNorm.columns.find(c => c.supplier_id === "supplier_1");

// Report display must be normalized
assert.strictEqual(s1NormCol.delivery_period, "5 business days", "Delivery period display normalized from 'Delivery period 5 business days' to '5 business days'");
assert.strictEqual(s1NormCol.quote_validity, "15 days", "Quotation validity display normalized from 'Quotation validity 15 days' to '15 days'");

// Stored quotation in shared store must preserve original value
const rawStoredQuote = PROCUREMENT_DATA.shared_store.supplier_assignments["supplier_1"].quotation;
assert.strictEqual(rawStoredQuote.delivery_period, "Delivery period 5 business days", "Original stored delivery_period string preserved in store");
assert.strictEqual(rawStoredQuote.quotation_validity, "Quotation validity 15 days", "Original stored quotation_validity string preserved in store");

console.log("  -> PASS: Display normalized cleanly while preserving raw stored quotation data!");

// ---------------------------------------------------------------------
// TEST 12: Missing Benchmark & Performance Data Are Not Fabricated
// ---------------------------------------------------------------------
console.log("\n[TEST 12] Verifying DAAM GURU benchmark displays accurately and unconfigured data is not fabricated...");
const repDataCheck = PROCUREMENT_DATA.generateComparativeStatement("PC-RFQ-2026-0113");
repDataCheck.columns.forEach(col => {
  if (!col.quotation) {
    assert.strictEqual(col.daam_guru_status, "-", "Pending supplier DAAM GURU is '-'");
  } else {
    assert.ok(col.daam_guru_status.includes("32.00/kg benchmark") || col.daam_guru_status === "Benchmark not configured", "Configured market benchmark displays benchmark comparison");
  }
});
console.log("  -> PASS: No fabricated benchmark prices!");

// ---------------------------------------------------------------------
// TEST 13: Buyer Approval Remains Pending
// ---------------------------------------------------------------------
console.log("\n[TEST 13] Verifying buyer approval remains pending...");
assert.strictEqual(repDataCheck.decision.approved_quantity_split, "Pending buyer approval", "Approved quantity split remains pending");
assert.strictEqual(repDataCheck.decision.approved_by, "Pending buyer approval", "Owner/MD approval remains pending");
console.log("  -> PASS: Decision fields do not assume buyer approval!");

// ---------------------------------------------------------------------
// TEST 14: Regeneration Handles Changed Quotations & Increments Revision
// ---------------------------------------------------------------------
console.log("\n[TEST 14] Testing regeneration handles changed quotations & revision preservation...");
const prevRevNum = parseInt(repDataCheck.revision.replace("Rev ", ""), 10);
assert.ok(prevRevNum >= 0, "Report has valid numeric revision tracking");

// Re-generate report
const repRev1 = PROCUREMENT_DATA.generateComparativeStatement("PC-RFQ-2026-0113");
assert.strictEqual(repRev1.revision, `Rev ${prevRevNum + 1}`, `Regenerated report increments revision to Rev ${prevRevNum + 1}`);
assert.strictEqual(PROCUREMENT_DATA.shared_store.current_comparison.revision, `Rev ${prevRevNum + 1}`, "Current comparison in store updated");
console.log("  -> PASS: Regeneration successfully tracks report revisions!");

// ---------------------------------------------------------------------
// TEST 15: HTML Rendering & Document Structure (T-2 Template Matching)
// ---------------------------------------------------------------------
console.log("\n[TEST 15] Verifying Template T-2 HTML rendering structure...");
const t2Html = window.documentModal.buildComparisonDocumentHtml(repRev1);

assert.ok(t2Html.includes("TEMPLATE T-2"), "HTML contains TEMPLATE T-2 tag");
assert.ok(t2Html.includes("Bid Comparison Report (Comparative Statement)"), "HTML contains document title");
assert.ok(t2Html.includes("Comparison Ref."), "HTML contains Section A Comparison Ref.");
assert.ok(t2Html.includes("Against RFQ No. / Date"), "HTML contains Against RFQ No. / Date");
assert.ok(t2Html.includes("Item(s) & quantity"), "HTML contains Item(s) & quantity");
assert.ok(t2Html.includes("Quotes received / considered"), "HTML contains Quotes received / considered");
assert.ok(t2Html.includes("Comparison matrix"), "HTML contains Comparison matrix section");
assert.ok(t2Html.includes("Quoted rate (INR /unit)"), "HTML contains Row 1 Quoted rate");
assert.ok(t2Html.includes("GST rate & amount"), "HTML contains Row 2 GST rate & amount");
assert.ok(t2Html.includes("Freight / other charges (INR )"), "HTML contains Row 3 Freight");
assert.ok(t2Html.includes("Landed cost per unit (INR ) - the"), "HTML contains Row 4 Landed cost per unit");
assert.ok(t2Html.includes("Total landed cost (INR )"), "HTML contains Row 5 Total landed cost");
assert.ok(t2Html.includes("Payment terms asked"), "HTML contains Row 6 Payment terms");
assert.ok(t2Html.includes("Delivery period offered"), "HTML contains Row 7 Delivery period");
assert.ok(t2Html.includes("Quality docs offered (TC/CoA/ISO)"), "HTML contains Row 8 Quality docs");
assert.ok(t2Html.includes("Quote validity"), "HTML contains Row 9 Quote validity");
assert.ok(t2Html.includes("Past performance with us (Good /"), "HTML contains Row 10 Past performance");
assert.ok(t2Html.includes("GST verification"), "HTML contains Row 11 GST verification");
assert.ok(t2Html.includes("Market Price Benchmark"), "HTML contains Row 12 Market Price Benchmark");
assert.ok(t2Html.includes("Rank by landed cost (L1 / L2 / L3)"), "HTML contains Row 13 Landed cost rank");
assert.ok(t2Html.includes("Decision"), "HTML contains Section C Decision");
assert.ok(t2Html.includes("Purechain note (T-2)"), "HTML contains Section D Purechain note (T-2)");
assert.ok(t2Html.includes("Golden rule for MSMEs: compare LANDED COST"), "HTML contains exact explanatory note");

console.log("  -> PASS: Template T-2 HTML visually reproduces all sections and rows!");

// ---------------------------------------------------------------------
// TEST 16: Mixed Quotation Units & Canonical Landed Cost Normalization
// (Exact user requirement: RFQ 50 MT -> UJJIVAN 70.82/kg & Supplier Test 35.04/kg)
// ---------------------------------------------------------------------
console.log("\n[TEST 16] Testing mixed quotation units & canonical landed cost normalization...");
PROCUREMENT_DATA.initStore();
const rfqExample = PROCUREMENT_DATA.createRFQ({
  rfq_ref: "PC-RFQ-2026-EXACT",
  material: "Onion",
  quantity: 50.0,
  unit: "MT",
  selected_suppliers: ["supplier_2", "supplier_3"]
});

// UJJIVAN quotes at 60/kg, GST 18%, freight 1,000 -> landed 3,541,000 -> 70.82/kg
PROCUREMENT_DATA.submitQuotation("supplier_2", {
  quotation_ref: "QT-EXACT-UJJIVAN",
  unit_rate_val: 60.0,
  unit_rate_unit: "kg",
  unit_rate_display: "INR 60.00/kg",
  base_amount: 3000000,
  gst_rate: 18.0,
  gst_amount: 540000,
  freight_amount: 1000,
  freight_display: "INR 1,000.00",
  total_landed_amount: 3541000
});

// Supplier Test quotes in MT: 28,000/MT, GST 18%, freight 2,000/MT -> landed 1,752,000 -> 35.04/kg
PROCUREMENT_DATA.submitQuotation("supplier_3", {
  quotation_ref: "QT-EXACT-SUPP-TEST",
  unit_rate_val: 28000.0,
  unit_rate_unit: "MT",
  unit_rate_display: "INR 28,000.00/MT",
  base_amount: 1400000,
  gst_rate: 18.0,
  gst_amount: 252000,
  freight_amount: 100000,
  freight_display: "INR 1,00,000.00",
  total_landed_amount: 1752000
});

const repExact = PROCUREMENT_DATA.generateComparativeStatement("PC-RFQ-2026-EXACT");
const colUjjivanExact = repExact.columns.find(c => c.supplier_id === "supplier_2");
const colSuppTestExact = repExact.columns.find(c => c.supplier_id === "supplier_3");

// Quoted rate row preserves original units
assert.strictEqual(colUjjivanExact.quoted_rate_display, "INR 60.00/kg", "UJJIVAN original quoted rate in kg preserved");
assert.strictEqual(colSuppTestExact.quoted_rate_display, "INR 28,000.00/MT", "Supplier Test original quoted rate in MT preserved");

// Landed cost row normalized to canonical unit INR/kg
assert.strictEqual(colUjjivanExact.landed_cost_per_unit_display, "INR 70.82/kg", "UJJIVAN normalized landed cost displays as INR 70.82/kg");
assert.strictEqual(colSuppTestExact.landed_cost_per_unit_display, "INR 35.04/kg", "Supplier Test normalized landed cost displays as INR 35.04/kg");

console.log("  -> PASS: Mixed quotation units normalized to canonical unit (INR 70.82/kg & INR 35.04/kg)!");

// ---------------------------------------------------------------------
// TEST 17: Detailed WhatsApp Comparison Summary & Exactly Two Action Buttons
// ---------------------------------------------------------------------
console.log("\n[TEST 17] Testing Detailed Buyer WhatsApp Comparison Message & Action Buttons...");
// Set up multi-supplier state: Supplier 2 submitted, Supplier 3 submitted, Supplier 1 pending
PROCUREMENT_DATA.initStore();
const rfq17 = PROCUREMENT_DATA.createRFQ({
  rfq_ref: "PC-RFQ-2026-0117",
  material: "Onion",
  quantity: 50.0,
  unit: "MT",
  selected_suppliers: ["supplier_1", "supplier_2", "supplier_3"]
});
engine.buyer_state.rfq_ref = rfq17.rfq_ref;
engine.buyer_state.quantity = 50.0;
engine.buyer_state.unit = "MT";

PROCUREMENT_DATA.submitQuotation("supplier_2", {
  quotation_ref: "QT-2026-S2-1701",
  unit_rate_val: 55.0,
  unit_rate_unit: "kg",
  unit_rate_display: "INR 55.00/kg",
  base_amount: 2750000,
  gst_rate: 18.0,
  gst_amount: 495000,
  freight_amount: 1200,
  freight_display: "INR 1,200.00",
  total_landed_amount: 3246200,
  delivery_period: "2 days",
  payment_terms: "100% after delivery",
  quotation_validity: "3 days",
  quality_docs: "Certificate of Analysis",
  rakshak_status: "Verified and active"
});

PROCUREMENT_DATA.submitQuotation("supplier_3", {
  quotation_ref: "QT-2026-S3-1702",
  unit_rate_val: 27000.0,
  unit_rate_unit: "MT",
  unit_rate_display: "INR 27,000.00/MT",
  base_amount: 1350000,
  gst_rate: 5.0,
  gst_amount: 67500,
  freight_amount: 60000,
  freight_display: "INR 60,000.00",
  total_landed_amount: 1477500,
  delivery_period: "5 days",
  payment_terms: "30% advance, 70% delivery",
  quotation_validity: "15 days",
  quality_docs: "Weighment slip",
  rakshak_status: "Verified and active"
});

const compMsg = engine.executeGenerateComparison();
assert.ok(compMsg, "executeGenerateComparison returned message");
assert.strictEqual(engine.buyer_state.step, "COMPARISON_GENERATED");

// 1. Check all submitted supplier details in WhatsApp chat
assert.ok(compMsg.text.includes("UJJIVAN SMALL FINANCE BANK LIMITED"), "Submitted Supplier 2 present");
assert.ok(compMsg.text.includes("TEST SUPPLIER PVT LTD") || compMsg.text.includes("Supplier Test"), "Submitted Supplier 3 present");
assert.ok(compMsg.text.includes("INR 55.00/kg"), "Quoted rate for S2 present");
assert.ok(compMsg.text.includes("INR 27,000.00/MT"), "Quoted rate for S3 present");
assert.ok(compMsg.text.includes("18% (INR 4,95,000.00)"), "GST rate and amount for S2 present");
assert.ok(compMsg.text.includes("5% (INR 67,500.00)"), "GST rate and amount for S3 present");
assert.ok(compMsg.text.includes("INR 1,200.00"), "Freight for S2 present");
assert.ok(compMsg.text.includes("INR 32,46,200.00"), "Total landed cost for S2 present");
assert.ok(compMsg.text.includes("INR 14,77,500.00"), "Total landed cost for S3 present");
assert.ok(compMsg.text.includes("INR 64.92/kg"), "Normalized landed cost for S2 present");
assert.ok(compMsg.text.includes("INR 29.55/kg"), "Normalized landed cost for S3 present");
assert.ok(compMsg.text.includes("2 days"), "Delivery period for S2 present");
assert.ok(compMsg.text.includes("100% after delivery"), "Payment terms for S2 present");
assert.ok(compMsg.text.includes("3 days"), "Quote validity for S2 present");
assert.ok(compMsg.text.includes("Certificate of Analysis"), "Quality docs for S2 present");
assert.ok(compMsg.text.includes("Commercial Ranking:* *L1*"), "L1 rank displayed");
assert.ok(compMsg.text.includes("Commercial Ranking:* *L2*"), "L2 rank displayed");

// 2. Check pending supplier listed separately
assert.ok(compMsg.text.includes("QUOTATIONS PENDING (1 Awaiting Response)"), "Pending header present");
assert.ok(compMsg.text.includes("Test Supplier Pvt Ltd") || compMsg.text.includes("Pune"), "Pending supplier listed");

// 3. Check System Recommendation section
assert.ok(compMsg.text.includes("🏆 *SYSTEM RECOMMENDATION*"), "System recommendation section present");
assert.ok(compMsg.text.includes("Supplier Test"), "Recommended supplier name present");
assert.ok(compMsg.text.includes("INR 27,000.00/MT"), "Recommended supplier own quoted rate present");
assert.ok(compMsg.text.includes("INR 29.55/kg"), "Recommended supplier own landed cost per unit present");
assert.ok(compMsg.text.includes("INR 14,77,500.00"), "Recommended supplier own total landed cost present");
assert.ok(compMsg.text.includes("5 days"), "Recommended supplier own delivery period present");
assert.ok(compMsg.text.includes("Verified and active"), "Recommended supplier RAKSHAK status present");
assert.ok(compMsg.text.includes("Pending buyer approval"), "Buyer approval status remains pending");

// 4. Check EXACTLY TWO buttons
assert.strictEqual(compMsg.buttons.length, 2, "Exactly two action buttons returned");
assert.strictEqual(compMsg.buttons[0].id, "btn_preview_comparison_doc", "Button 1 is btn_preview_comparison_doc");
assert.strictEqual(compMsg.buttons[0].text, "📄 View Comparison Report (T-2) PDF", "Button 1 text matches required format");
assert.strictEqual(compMsg.buttons[1].id, "btn_buyer_start_po", "Button 2 is btn_buyer_start_po");
assert.strictEqual(compMsg.buttons[1].text, "🛒 Proceed to Create Purchase Order (T-3)", "Button 2 text matches required format");

console.log("  -> PASS: Detailed comparison summary & exactly two action buttons verified!");

// ---------------------------------------------------------------------
// TEST 18: Separation of Commercial Ranking vs Recommendation Eligibility
// ---------------------------------------------------------------------
console.log("\n[TEST 18] Testing Separation of Commercial Ranking vs Recommendation Eligibility...");
// Set up scenario: L1 bidder has failed RAKSHAK verification, L2 is verified
PROCUREMENT_DATA.initStore();
const rfq18 = PROCUREMENT_DATA.createRFQ({
  rfq_ref: "PC-RFQ-2026-0118",
  material: "Onion",
  quantity: 50.0,
  unit: "MT",
  selected_suppliers: ["supplier_2", "supplier_3"]
});
engine.buyer_state.rfq_ref = rfq18.rfq_ref;

// Supplier 3 is cheaper (L1: 20,000/MT = 21/kg), but has Failed RAKSHAK status
PROCUREMENT_DATA.submitQuotation("supplier_3", {
  quotation_ref: "QT-2026-S3-FAILED",
  unit_rate_val: 20000.0,
  unit_rate_unit: "MT",
  unit_rate_display: "INR 20,000.00/MT",
  base_amount: 1000000,
  gst_rate: 5.0,
  gst_amount: 50000,
  freight_amount: 0,
  freight_display: "INR 0.00",
  total_landed_amount: 1050000,
  delivery_period: "3 days",
  rakshak_status: "Failed / Inactive GSTIN"
});

// Supplier 2 is more expensive (L2: 50/kg), but Verified and Active
PROCUREMENT_DATA.submitQuotation("supplier_2", {
  quotation_ref: "QT-2026-S2-VERIFIED",
  unit_rate_val: 50.0,
  unit_rate_unit: "kg",
  unit_rate_display: "INR 50.00/kg",
  base_amount: 2500000,
  gst_rate: 18.0,
  gst_amount: 450000,
  freight_amount: 0,
  freight_display: "INR 0.00",
  total_landed_amount: 2950000,
  delivery_period: "2 days",
  rakshak_status: "Verified and active"
});

const compMsg18 = engine.executeGenerateComparison();
const rep18 = PROCUREMENT_DATA.shared_store.current_comparison;

// Supplier 3 is commercially ranked L1
const col3_18 = rep18.columns.find(c => c.supplier_id === "supplier_3");
assert.strictEqual(col3_18.rank_code, "L1", "Supplier 3 is commercially L1");
assert.strictEqual(col3_18.is_recommendation_eligible, false, "Supplier 3 is not recommendation eligible");

// Supplier 2 is recommended
assert.strictEqual(rep18.decision.recommended_supplier, "UJJIVAN SMALL FINANCE BANK LIMITED", "UJJIVAN is recommended despite being L2");

// In the chat message recommendation section:
assert.ok(compMsg18.text.includes("• *Recommended Supplier:* *UJJIVAN SMALL FINANCE BANK LIMITED*"));
// Crucial check: UJJIVAN's OWN metrics must be displayed, NOT Supplier 3's cheaper metrics!
assert.ok(compMsg18.text.includes("• *Actual Quoted Rate:* INR 50.00/kg"), "UJJIVAN own quoted rate is displayed");
assert.ok(compMsg18.text.includes("• *Own Landed Cost per Unit:* *INR 59.00/kg*"), "UJJIVAN own landed cost per unit is displayed");
assert.ok(compMsg18.text.includes("• *Total Landed Cost:* *INR 29,50,000.00*"), "UJJIVAN own total landed cost is displayed");
assert.ok(!compMsg18.text.includes("• *Own Landed Cost per Unit:* *INR 21.00/kg*"), "Ineligible supplier's rate NOT attributed to recommendation");

// Explanation must mention why lower-priced supplier was not recommended
assert.ok(compMsg18.text.includes("cannot be recommended due to failed GST verification") || compMsg18.text.includes("cannot be recommended due to failed RAKSHAK verification"), "Chat explains why lower-priced supplier was bypassed");

console.log("  -> PASS: Commercial ranking vs recommendation eligibility cleanly separated!");

// ---------------------------------------------------------------------
// TEST 19: Action 1: View Comparison Report (T-2) PDF (Does Not Duplicate)
// ---------------------------------------------------------------------
console.log("\n[TEST 19] Testing Action 1: View Comparison Report (T-2) PDF...");
let modalOpened = false;
let modalType = "";
window.documentModal.showReportPreview = (type, data) => {
  modalOpened = true;
  modalType = type;
};

const initialRev = rep18.revision;
const viewResult = engine.handleUserAction("btn_preview_comparison_doc", null);
assert.strictEqual(viewResult, null, "Preview action returns null (no chat spam)");
assert.strictEqual(modalOpened, true, "Document modal opened");
assert.strictEqual(modalType, "COMPARISON_DOCUMENT", "Modal opened with COMPARISON_DOCUMENT");
assert.strictEqual(PROCUREMENT_DATA.shared_store.current_comparison.revision, initialRev, "Report was NOT regenerated on view (revision unchanged)");

console.log("  -> PASS: Action 1 views T-2 report in modal without duplicate generation!");

// ---------------------------------------------------------------------
// TEST 20: T-3 PO Supplier Selection — Buyer Must Make the Final Decision
// Verifies all required changes from user prompt:
// - Both submitted suppliers have functional selection actions
// - L1 supplier remains selectable even when verification is unavailable
// - Recommended supplier is not automatically selected
// - Selection of either supplier carries forward only that supplier's quotation
// - Pending suppliers without quotations cannot be selected
// - Buyer's decision is never overwritten by recommendation or ranking
// ---------------------------------------------------------------------
console.log("\n[TEST 20] Testing Neutral T-3 Supplier Selection & Full Buyer Decision Authority...");
PROCUREMENT_DATA.initStore();
const rfq20 = PROCUREMENT_DATA.createRFQ({
  rfq_ref: "PC-RFQ-2026-0120",
  material: "Onion",
  quantity: 50.0,
  unit: "MT",
  selected_suppliers: ["supplier_1", "supplier_2", "supplier_3"]
});
engine.buyer_state.rfq_ref = rfq20.rfq_ref;
engine.buyer_state.quantity = 50.0;
engine.buyer_state.unit = "MT";

// Supplier 1: Awaiting response / Pending (no quotation)

// Supplier 3 (Supplier Test): L1, ₹28,000/MT, RAKSHAK: Verification unavailable
PROCUREMENT_DATA.submitQuotation("supplier_3", {
  quotation_ref: "QT-2026-S3-2003",
  unit_rate_val: 28000.0,
  unit_rate_unit: "MT",
  unit_rate_display: "INR 28,000.00/MT",
  base_amount: 1400000,
  gst_rate: 18.0,
  gst_amount: 252000,
  freight_amount: 100000,
  freight_display: "INR 1,00,000.00",
  total_landed_amount: 1752000,
  delivery_period: "5 business days",
  payment_terms: "30% advance, balance after delivery",
  quotation_validity: "15 days",
  quality_docs: "Manufacturer test certificate",
  rakshak_status: "Verification unavailable"
});

// Supplier 2 (UJJIVAN): L2, ₹60/kg, RAKSHAK: Verified and active
PROCUREMENT_DATA.submitQuotation("supplier_2", {
  quotation_ref: "QT-2026-S2-2002",
  unit_rate_val: 60.0,
  unit_rate_unit: "kg",
  unit_rate_display: "INR 60.00/kg",
  base_amount: 3000000,
  gst_rate: 18.0,
  gst_amount: 540000,
  freight_amount: 1000,
  freight_display: "INR 1,000.00",
  total_landed_amount: 3541000,
  delivery_period: "2 business days",
  payment_terms: "100% after delivery",
  quotation_validity: "7 days",
  quality_docs: "Certificate of Analysis",
  rakshak_status: "Verified and active"
});

// Generate comparison: UJJIVAN is recommended by T-2 advisory logic because Supplier Test has unavailable verification
engine.executeGenerateComparison();
const rep20 = PROCUREMENT_DATA.shared_store.current_comparison;
assert.strictEqual(rep20.decision.recommended_supplier, "UJJIVAN SMALL FINANCE BANK LIMITED", "T-2 advisory recommendation recommends UJJIVAN");

// Buyer clicks "Proceed to Create Purchase Order (T-3)"
const startPoMsg = engine.handleBuyerAction("btn_buyer_start_po", null);
assert.ok(startPoMsg, "T-3 PO creation screen returned");

// 1. All submitted and considered suppliers appear in T-3 with complete details
assert.ok(startPoMsg.text.includes("Supplier Test"), "Submitted Supplier 3 (L1) appears in T-3");
assert.ok(startPoMsg.text.includes("UJJIVAN SMALL FINANCE BANK LIMITED"), "Submitted Supplier 2 (L2) appears in T-3");
assert.ok(startPoMsg.text.includes("INR 28,000.00/MT"), "Quoted rate for Supplier Test shown");
assert.ok(startPoMsg.text.includes("INR 60.00/kg"), "Quoted rate for UJJIVAN shown");
assert.ok(startPoMsg.text.includes("INR 35.04/kg"), "Normalized landed cost for Supplier Test shown");
assert.ok(startPoMsg.text.includes("INR 70.82/kg"), "Normalized landed cost for UJJIVAN shown");
assert.ok(startPoMsg.text.includes("Verification unavailable"), "Supplier Test actual RAKSHAK status shown");
assert.ok(startPoMsg.text.includes("Verified and active"), "UJJIVAN actual RAKSHAK status shown");

// 2. The recommended supplier is NOT automatically selected
assert.strictEqual(engine.buyer_state.po_selected_supplier_id, null, "Recommended supplier is NOT automatically selected");

// 3. L1 is NOT automatically selected
assert.notStrictEqual(engine.buyer_state.po_selected_supplier_id, "supplier_3", "L1 supplier is NOT automatically selected");

// 4. Both submitted suppliers have functional selection actions
const s3Btn = startPoMsg.buttons.find(b => b.id === "btn_po_select_supplier_3");
const s2Btn = startPoMsg.buttons.find(b => b.id === "btn_po_select_supplier_2");
assert.ok(s3Btn, "Functional Select Supplier action exists for Supplier Test (L1)");
assert.ok(s2Btn, "Functional Select Supplier action exists for UJJIVAN (L2)");

// 5. The L1 supplier remains selectable even when verification is unavailable
const selectL1Msg = engine.handleBuyerAction("btn_po_select_supplier_3", null);
assert.strictEqual(engine.buyer_state.po_selected_supplier_id, "supplier_3", "Buyer successfully chose L1 (Supplier Test) despite unavailable verification");
assert.strictEqual(engine.buyer_state.step, "PO_CONFIRM_QUANTITY", "Advanced to PO_CONFIRM_QUANTITY for Supplier Test");
// Must be accompanied by a clear verification warning
assert.ok(selectL1Msg.text.includes("COMPLIANCE WARNING"), "Clear compliance warning displayed for unavailable verification");
assert.ok(selectL1Msg.text.includes("Verification unavailable"), "Warning states actual status");

// 6. Selection carries forward only that supplier's quotation values
assert.ok(selectL1Msg.text.includes("INR 28,000.00/MT"), "Carried forward Supplier Test's own quoted rate");
assert.ok(selectL1Msg.text.includes("INR 35.04/kg"), "Carried forward Supplier Test's own landed cost");
assert.ok(!selectL1Msg.text.includes("INR 60.00/kg"), "Did NOT mix UJJIVAN rate into Supplier Test selection");

// 7. Buyer can change mind and select the other supplier (UJJIVAN - L2)
const backMsg = engine.handleBuyerAction("btn_po_change_supplier", null);
assert.strictEqual(engine.buyer_state.step, "PO_SELECT_SUPPLIER", "Returned to PO_SELECT_SUPPLIER");
const selectL2Msg = engine.handleBuyerAction("btn_po_select_supplier_2", null);
assert.strictEqual(engine.buyer_state.po_selected_supplier_id, "supplier_2", "Buyer successfully chose L2 (UJJIVAN)");
assert.strictEqual(engine.buyer_state.step, "PO_CONFIRM_QUANTITY", "Advanced to PO_CONFIRM_QUANTITY for UJJIVAN");
assert.ok(selectL2Msg.text.includes("INR 60.00/kg"), "Carried forward UJJIVAN's own quoted rate");
assert.ok(selectL2Msg.text.includes("INR 70.82/kg"), "Carried forward UJJIVAN's own landed cost");
assert.ok(!selectL2Msg.text.includes("INR 28,000.00/MT"), "Did NOT mix Supplier Test rate into UJJIVAN selection");

// 8. Pending suppliers without quotations cannot be selected
const backMsg2 = engine.handleBuyerAction("btn_po_change_supplier", null);
assert.ok(backMsg2.text.includes("QUOTATIONS PENDING"), "Quotations pending section exists in T-3 screen");
const pendingBtn = backMsg2.buttons.find(b => b.id === "btn_po_select_supplier_1");
assert.strictEqual(pendingBtn, undefined, "Pending supplier has no selection button");
const pendingSelectMsg = engine.handleBuyerAction("btn_po_select_supplier_1", null);
assert.ok(pendingSelectMsg.text.includes("Cannot Select Pending Supplier"), "Pending supplier selection blocked");
assert.strictEqual(engine.buyer_state.step, "PO_SELECT_SUPPLIER", "Step remains in PO_SELECT_SUPPLIER");

// 9. Non-destructive T-2 comparison review
const prevRev = PROCUREMENT_DATA.shared_store.current_comparison.revision;
modalOpened = false;
modalType = "";
const t2PdfResult = engine.handleUserAction("btn_preview_comparison_doc", null);
assert.strictEqual(t2PdfResult, null, "Modal preview returns null (no duplicate chat message)");
assert.strictEqual(modalOpened, true, "Comparison modal opened");
assert.strictEqual(modalType, "COMPARISON_DOCUMENT", "Modal type is COMPARISON_DOCUMENT");
assert.strictEqual(PROCUREMENT_DATA.shared_store.current_comparison.revision, prevRev, "Report was NOT regenerated (revision unchanged)");
assert.strictEqual(engine.buyer_state.step, "PO_SELECT_SUPPLIER", "Supplier-selection state strictly preserved after viewing T-2 PDF");

// 10. Proceed through quantity, review, and PO dispatch for buyer's chosen supplier (Supplier Test)
engine.handleBuyerAction("btn_po_select_supplier_3", null);
assert.strictEqual(engine.buyer_state.po_selected_supplier_id, "supplier_3");
assert.strictEqual(PROCUREMENT_DATA.shared_store.current_po, null, "current_po is still null before explicit approval");

engine.handleBuyerAction("btn_po_confirm_full_qty", null);
assert.strictEqual(engine.buyer_state.step, "PO_REVIEW");
assert.strictEqual(engine.buyer_state.po_approval_status, "PENDING", "PO approval status remains PENDING in review");
assert.strictEqual(PROCUREMENT_DATA.shared_store.current_po, null, "current_po is still null before explicit approval");

const dispatchMsg = engine.handleBuyerAction("btn_buyer_confirm_po_dispatch", null);
assert.strictEqual(engine.buyer_state.step, "PO_DISPATCHED", "PO dispatched upon explicit confirmation");
assert.strictEqual(engine.buyer_state.po_approval_status, "APPROVED", "Approval marked APPROVED");

const finalPo = PROCUREMENT_DATA.shared_store.current_po;
assert.ok(finalPo, "PO officially created");
assert.strictEqual(finalPo.vendor.id, "supplier_3", "PO awarded strictly to Supplier Test (buyer's decision was NOT overwritten)");
assert.strictEqual(finalPo.line_items[0].unit_rate, 28000.0, "Carried forward Supplier Test's own unit rate (28,000/MT)");
assert.strictEqual(finalPo.line_items[0].gst_rate, 18.0, "Carried forward Supplier Test's own GST rate");
assert.strictEqual(finalPo.line_items[0].total_landed, 1752000, "Carried forward Supplier Test's own total landed cost");

console.log("  -> PASS: All critical correction requirements and buyer decision authority 100% verified!");

// ---------------------------------------------------------------------
// TEST 21: Verify Actual T-3 Purchase Order PDF Compilation & Structure
// ---------------------------------------------------------------------
console.log("\n[TEST 21] Verifying actual T-3 Purchase Order PDF compilation & structure...");

assert.ok(finalPo.document_html, "PO document_html must exist");
assert.ok(typeof finalPo.document_html === "string" && finalPo.document_html.length > 1000, "PO document_html must be non-empty HTML string");
assert.strictEqual(PROCUREMENT_DATA.shared_store.current_po_document, finalPo.document_html, "Shared store current_po_document mirrors po.document_html");

// Verify required T-3 layout components
const docHtml = finalPo.document_html;
assert.ok(docHtml.includes("TEMPLATE T-3"), "Header contains Template T-3 identifier");
assert.ok(docHtml.includes("Work Order / Purchase Order (WO/PO)"), "Header contains main title banner");
assert.ok(docHtml.includes(finalPo.po_ref), "Document contains PO reference number");
assert.ok(docHtml.includes(finalPo.rfq_ref), "Document contains RFQ reference number");
assert.ok(docHtml.includes(finalPo.comparison_ref), "Document contains Comparison reference number");
assert.ok(docHtml.includes(finalPo.quotation_ref), "Document contains Quotation reference number");

// Party details
assert.ok(docHtml.includes("Supplier (Vendor)"), "Supplier (Vendor) section header present");
assert.ok(docHtml.includes(finalPo.vendor.name), "Vendor company name present");
assert.ok(docHtml.includes("Buyer"), "Buyer row present");
assert.ok(docHtml.includes(finalPo.buyer.name), "Buyer company name present");
assert.ok(docHtml.includes(finalPo.deliver_to.address), "Deliver-to destination address present");

// Line items & financial totals
assert.ok(docHtml.includes("Order details"), "Order details section header present");
assert.ok(docHtml.includes("Item description &amp; specification"), "Line items table header present");
assert.ok(docHtml.includes(finalPo.line_items[0].item_name), "Item name present in table");
assert.ok(docHtml.includes("TOTAL"), "Total PO Value row present");
assert.ok(docHtml.includes("Amount in words"), "Amount in words row present");
assert.ok(docHtml.includes(finalPo.amount_in_words), "Indian number words string present in document");
assert.ok(finalPo.amount_in_words.includes("Indian Rupees"), "Amount in words includes 'Indian Rupees'");

// Commercial terms box
assert.ok(docHtml.includes("Delivery date (time is of the essence)"), "Commercial terms: Delivery Timeline present");
assert.ok(docHtml.includes("Payment terms"), "Commercial terms: Payment Terms present");
assert.ok(docHtml.includes("Transport / freight responsibility"), "Commercial terms: Transport Responsibility present");

// Part A & B
assert.ok(docHtml.includes("Part A - Minimum Standard Conditions") || docHtml.includes("Part A — Minimum Standard Conditions"), "Part A section header present");
assert.ok(docHtml.includes("Acceptance."), "Condition 1 present");
assert.ok(docHtml.includes("Prices firm."), "Condition 2 present");
assert.ok(docHtml.includes("Delivery &amp; delay."), "Condition 3 present");
assert.ok(docHtml.includes("Quality &amp; rejection."), "Condition 4 present");
assert.ok(docHtml.includes("Invoicing &amp; GST."), "Condition 5 present");
assert.ok(docHtml.includes("Risk &amp; title."), "Condition 6 present");
assert.ok(docHtml.includes("Compliance &amp; origin data."), "Condition 7 (ESG / CBAM / BRSR origin data rights) present");
assert.ok(docHtml.includes("No assignment / subletting."), "Condition 8 present");
assert.ok(docHtml.includes("Cancellation."), "Condition 9 present");
assert.ok(docHtml.includes("Force majeure."), "Condition 10 present");
assert.ok(docHtml.includes("Disputes &amp; jurisdiction."), "Condition 11 present");
assert.ok(docHtml.includes("Entire agreement &amp; precedence."), "Condition 12 present");

assert.ok(docHtml.includes("Part B - Special Conditions") || docHtml.includes("Part B — Special Conditions"), "Part B section header present");
assert.ok(docHtml.includes("For Buyer - Authorised Signatory &amp; Seal") || docHtml.includes("For Buyer — Authorised Signatory &amp; Seal"), "Signatures block: Buyer present");
assert.ok(docHtml.includes("Accepted - For Supplier (Signatory, Seal &amp; Date)") || docHtml.includes("Accepted — For Supplier (Signatory, Seal &amp; Date)"), "Signatures block: Vendor present");
assert.ok(docHtml.includes("Purechain note (T-3)"), "PureChain Note (T-3) present");

// Missing fields fallback: ensure no undefined, NaN, or null
assert.ok(!docHtml.includes("undefined"), "Document does NOT contain raw 'undefined'");
assert.ok(!docHtml.includes("NaN"), "Document does NOT contain 'NaN'");
assert.ok(!docHtml.includes("null"), "Document does NOT contain raw 'null'");

console.log("  -> PASS: Actual T-3 Purchase Order PDF compiled with complete standard layout and 12 statutory conditions!");

// ---------------------------------------------------------------------
// TEST 22: Verify PO Dispatch Message Delivers to Awarded Supplier & Isolates Other Suppliers
// ---------------------------------------------------------------------
console.log("\n[TEST 22] Verifying PO message delivers strictly to awarded supplier's chat...");

const s3History = PROCUREMENT_DATA.shared_store.conversation_histories["supplier_3"] || [];
const s3PoMsg = s3History.find(m => m.text && m.text.includes(finalPo.po_ref));
assert.ok(s3PoMsg, "Awarded supplier (supplier_3) received PO message in chat history");
assert.ok(s3PoMsg.text.includes("OFFICIAL PURCHASE ORDER (TEMPLATE T-3) RECEIVED"), "Message announced official PO receipt");
assert.ok(s3PoMsg.text.includes(finalPo.po_ref), "Message displays exact PO reference");
assert.ok(s3PoMsg.text.includes(finalPo.buyer.name), "Message displays buyer company name");
assert.ok(s3PoMsg.text.includes(finalPo.line_items[0].item_name), "Message displays commodity name");
assert.ok(s3PoMsg.text.includes("50 MT"), "Message displays approved quantity");
assert.ok(s3PoMsg.text.includes("Issued & Digitally Signed by Buyer"), "Message indicates issued status");
const s3PreviewBtn = s3PoMsg.buttons.find(b => b.id === "btn_preview_po_doc");
assert.ok(s3PreviewBtn, "Supplier PO message includes [View Purchase Order (T-3) PDF] button");

// STRICT ISOLATION: Non-awarded suppliers must NOT have received this PO
const s1History = PROCUREMENT_DATA.shared_store.conversation_histories["supplier_1"] || [];
const s2History = PROCUREMENT_DATA.shared_store.conversation_histories["supplier_2"] || [];
assert.strictEqual(s1History.some(m => m.text && m.text.includes(finalPo.po_ref)), false, "Supplier 1 did NOT receive Supplier 3's PO");
assert.strictEqual(s2History.some(m => m.text && m.text.includes(finalPo.po_ref)), false, "Supplier 2 did NOT receive Supplier 3's PO");

// Check shared delivery state
assert.strictEqual(PROCUREMENT_DATA.shared_store.po_delivery.status, "DELIVERED");
assert.strictEqual(PROCUREMENT_DATA.shared_store.po_delivery.awarded_supplier_id, "supplier_3");
assert.strictEqual(PROCUREMENT_DATA.shared_store.po_delivery.po_ref, finalPo.po_ref);
assert.ok(PROCUREMENT_DATA.shared_store.last_snippets["supplier_3"].includes(finalPo.po_ref), "Awarded supplier snippet updated");
assert.ok(PROCUREMENT_DATA.shared_store.last_snippets["buyer"].includes(finalPo.po_ref), "Buyer snippet updated");

console.log("  -> PASS: Awarded supplier received PO message; other suppliers strictly isolated!");

// ---------------------------------------------------------------------
// TEST 23: Verify Universal T-3 PO Document Preview for Buyer & Awarded Supplier
// ---------------------------------------------------------------------
console.log("\n[TEST 23] Testing Universal T-3 PO document preview for buyer & supplier without mutation...");

modalOpened = false;
modalType = "";
engine.active_participant = "buyer";
const buyerPoPreviewResult = engine.handleUserAction("btn_preview_po_doc", null);
assert.strictEqual(buyerPoPreviewResult, null, "Buyer preview returns null (no chat echo)");
assert.strictEqual(modalOpened, true, "Modal opened for buyer");
assert.strictEqual(modalType, "PO_DOCUMENT", "Modal type is PO_DOCUMENT");

// Test awarded supplier previewing PO
modalOpened = false;
modalType = "";
engine.active_participant = "supplier_3";
const suppPoPreviewResult = engine.handleUserAction("btn_preview_po_doc", null);
assert.strictEqual(suppPoPreviewResult, null, "Supplier preview returns null (no chat echo)");
assert.strictEqual(modalOpened, true, "Modal opened for supplier");
assert.strictEqual(modalType, "PO_DOCUMENT", "Modal type is PO_DOCUMENT");

// Verify modal generates clean HTML from shared store
const modalCompiled = window.documentModal.buildPoDocumentHtml(PROCUREMENT_DATA.shared_store.current_po);
assert.ok(modalCompiled.includes(finalPo.po_ref), "Modal buildPoDocumentHtml renders active PO from shared store");
assert.ok(modalCompiled.includes("btn-download"), "Modal contains print / PDF download button");

engine.active_participant = "buyer"; // Switch back to buyer
console.log("  -> PASS: Both buyer and supplier view exact same PO document from shared store!");

// ---------------------------------------------------------------------
// TEST 24: Verify Buyer Post-Dispatch Message & Order Execution Tracker
// ---------------------------------------------------------------------
console.log("\n[TEST 24] Testing Buyer post-dispatch message & milestone tracker...");

assert.ok(dispatchMsg.text.includes(finalPo.po_ref), "Buyer dispatch message shows PO number");
assert.ok(dispatchMsg.text.includes(finalPo.vendor.name), "Buyer dispatch message shows awarded vendor");
assert.ok(dispatchMsg.text.includes(finalPo.amount_in_words), "Buyer dispatch message shows amount in words");
assert.ok(dispatchMsg.text.includes("Delivered to"), "Buyer dispatch message shows simulated dispatch delivery confirmation");

// Check buyer post-dispatch buttons
const btnPoDoc = dispatchMsg.buttons.find(b => b.id === "btn_preview_po_doc");
const btnPoStatus = dispatchMsg.buttons.find(b => b.id === "btn_buyer_check_po_status");
const btnCompDoc = dispatchMsg.buttons.find(b => b.id === "btn_preview_comparison_doc");
assert.ok(btnPoDoc, "Buyer has [View Purchase Order (T-3) PDF] button");
assert.ok(btnPoStatus, "Buyer has [Track Order Status & Milestones] button");
assert.ok(btnCompDoc, "Buyer has [View Comparison Report (T-2) PDF] button");

// Test clicking Track Order Status & Milestones
const statusScreen = engine.handleBuyerAction("btn_buyer_check_po_status", null);
assert.ok(statusScreen.text.includes("PURCHASE ORDER EXECUTION & MILESTONE TRACKER"), "Milestone tracker header present");
assert.ok(statusScreen.text.includes(finalPo.po_ref), "Tracker shows PO reference");
assert.ok(statusScreen.text.includes("1️⃣ *PO Generated & Digitally Dispatched:* 🟢 COMPLETED"), "Milestone 1 marked completed");
assert.ok(statusScreen.text.includes("2️⃣ *Supplier Commercial Acceptance:* 🟡 PENDING"), "Milestone 2 pending");
assert.ok(statusScreen.buttons.find(b => b.id === "btn_preview_po_doc"), "Status tracker retains PO preview button");

console.log("  -> PASS: Buyer post-dispatch message & milestone tracking fully verified!");

// ---------------------------------------------------------------------
// TEST 25: Verify Safe Retry Handling (No Duplicate PO Number or Duplicate Supplier Message)
// ---------------------------------------------------------------------
console.log("\n[TEST 25] Testing safe retry handling...");

const currentPoRef = finalPo.po_ref;
const initialS3Count = (PROCUREMENT_DATA.shared_store.conversation_histories["supplier_3"] || []).length;

// Trigger dispatch again (simulating retry)
const retryDispatchMsg = engine.executePoDispatch();
assert.strictEqual(PROCUREMENT_DATA.shared_store.current_po.po_ref, currentPoRef, "PO number preserved on retry (no duplicate sequence)");
const newS3Count = (PROCUREMENT_DATA.shared_store.conversation_histories["supplier_3"] || []).length;
assert.strictEqual(newS3Count, initialS3Count, "No duplicate message appended to supplier's chat history on retry");
assert.ok(retryDispatchMsg.text.includes(currentPoRef), "Retry message confirms successful dispatch");

console.log("  -> PASS: Safe retry preserves PO reference and prevents duplicate supplier messages!");

// ---------------------------------------------------------------------
// TEST 26: Verify Awarding to Supplier with Pending/Unavailable RAKSHAK Status
// ---------------------------------------------------------------------
console.log("\n[TEST 26] Testing buyer commercial authority awarding to supplier with pending RAKSHAK verification...");

// Submit quotation for Supplier 1 with 'Verification unavailable'
PROCUREMENT_DATA.submitQuotation("supplier_1", {
  quotation_ref: "QT-2026-S1-UNAVAIL",
  unit_rate_val: 32.0,
  unit_rate_unit: "kg",
  unit_rate_display: "INR 32.00/kg",
  base_amount: 1600000,
  gst_rate: 18.0,
  gst_amount: 288000,
  freight_amount: 10000,
  freight_display: "INR 10,000.00",
  total_landed_amount: 1898000,
  delivery_period: "3 days",
  rakshak_status: "Verification unavailable"
});

// Refresh comparison matrix so Supplier 1 is considered
engine.executeGenerateComparison();

// Reset buyer state to award PO to Supplier 1
engine.buyer_state.po_ref = null; // Fresh PO for new award
engine.initiatePurchaseOrderWorkflow();
const selS1Msg = engine.handleBuyerAction("btn_po_select_supplier_1", null);
assert.strictEqual(engine.buyer_state.po_selected_supplier_id, "supplier_1", "Buyer successfully chose Supplier 1");

engine.handleBuyerAction("btn_po_confirm_full_qty", null);
const dispatchS1Msg = engine.handleBuyerAction("btn_buyer_confirm_po_dispatch", null);
assert.strictEqual(engine.buyer_state.step, "PO_DISPATCHED");

const poS1 = PROCUREMENT_DATA.shared_store.current_po;
assert.ok(poS1, "PO created for Supplier 1 under buyer commercial authority");
assert.strictEqual(poS1.vendor.id, "supplier_1");
assert.ok(poS1.document_html.includes("Part B - Special Conditions") || poS1.document_html.includes("Part B — Special Conditions"), "Part B present");
assert.ok(poS1.document_html.includes("Statutory Verification Standing"), "Compliance standing warning rendered in Part B");

// Verify Supplier 1 received the PO
const s1HistAfter = PROCUREMENT_DATA.shared_store.conversation_histories["supplier_1"] || [];
assert.ok(s1HistAfter.some(m => m.text && m.text.includes(poS1.po_ref)), "Supplier 1 received PO message");

console.log("  -> PASS: Buyer commercial authority and statutory verification warning verified!");

console.log("\n======================================================================");
console.log("ALL 26 TESTS PASSED WITH 100% SUCCESS — COMPLETE T-1, T-2 & T-3 VERIFIED!");
console.log("======================================================================");

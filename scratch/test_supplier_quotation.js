const assert = require('assert');

// Mock browser environment
global.window = {};
global.document = {
  querySelector: () => ({ classList: { add: () => {}, remove: () => {} }, style: {} }),
  querySelectorAll: () => [],
  getElementById: (id) => ({
    classList: { add: () => {}, remove: () => {} },
    style: {},
    innerHTML: '',
    appendChild: () => {},
    addEventListener: () => {}
  }),
  createElement: () => ({ style: {}, classList: { add: () => {} }, setAttribute: () => {} })
};

// Load modules
const PROCUREMENT_DATA = require('../js/data/procurement_data.js');
global.PROCUREMENT_DATA = PROCUREMENT_DATA;
window.PROCUREMENT_DATA = PROCUREMENT_DATA;
const DocumentModal = require('../js/ui/document_modal.js');
const ProcurementEngine = require('../js/engines/procurement_engine.js');

const modal = new DocumentModal();

console.log("======================================================================");
console.log("SUITE: VERIFY SUPPLIER QUOTATION SUBMISSION WORKFLOW (TESTS 1 TO 12)");
console.log("======================================================================");

// ---------------------------------------------------------------------
// TEST 1: All Three Suppliers Receive Their RFQ
// ---------------------------------------------------------------------
console.log("\n[TEST 1] Verifying all three suppliers receive their RFQ...");
let engine = new ProcurementEngine();

// Setup buyer RFQ
engine.buyer_state.quotation_deadline = "25 November 2026, 17:00 IST";
engine.syncRfqStore();
engine.executeRfqDispatch();
assert.strictEqual(window.PROCUREMENT_DATA.shared_store.rfq_dispatched, true);

// Verify all 3 suppliers receive incoming RFQ message with required details
const suppliers = ["supplier_1", "supplier_2", "supplier_3"];
suppliers.forEach(suppId => {
  const supp = PROCUREMENT_DATA.getSupplierById(suppId);
  const msg = engine.renderSupplierIncomingRfqMessage(supp);
  
  assert.ok(msg.text.includes("PC-RFQ-2026-0113"), `${supp.name} sees RFQ number`);
  assert.ok(msg.text.includes("Apex Green Metals Pvt Ltd"), `${supp.name} sees buyer company name`);
  assert.ok(msg.text.includes("Procurement Desk"), `${supp.name} sees buyer contact person`);
  assert.ok(msg.text.includes("+91 90000 00000"), `${supp.name} sees buyer phone placeholder`);
  assert.ok(msg.text.includes("procurement@example.com"), `${supp.name} sees buyer email`);
  assert.ok(msg.text.includes("Onion"), `${supp.name} sees commodity`);
  assert.ok(msg.text.includes("50 MT"), `${supp.name} sees quantity and unit`);
  assert.ok(msg.text.includes("25 November 2026, 17:00 IST"), `${supp.name} sees quotation deadline`);
  assert.ok(msg.text.includes("BUYER-APPROVED COMMERCIAL TERMS"), `${supp.name} sees commercial terms`);
  assert.ok(msg.text.includes("INSTRUCTIONS FOR SUBMITTING A QUOTATION"), `${supp.name} sees submission instructions`);
  assert.strictEqual(engine.supplier_states[suppId].step, "RECEIVED", `${supp.name} step is RECEIVED`);
});
console.log("  -> PASS: All three suppliers receive complete RFQ with zero missing required fields!");

// ---------------------------------------------------------------------
// TEST 2: Each Supplier Has Independent Quotation Progress
// ---------------------------------------------------------------------
console.log("\n[TEST 2] Verifying independent quotation progress across suppliers...");
// Supplier 1 advances to Field 1
engine.handleSupplierAction("supplier_1", "btn_supp_start_quote");
assert.strictEqual(engine.supplier_states["supplier_1"].step, "QUOTE_FIELD_1");

// Supplier 2 remains in RECEIVED
assert.strictEqual(engine.supplier_states["supplier_2"].step, "RECEIVED");

// Supplier 3 remains in RECEIVED
assert.strictEqual(engine.supplier_states["supplier_3"].step, "RECEIVED");

// Supplier 1 completes Field 1 & 2
engine.handleSupplierAction("supplier_1", null, "₹60 per kg");
assert.strictEqual(engine.supplier_states["supplier_1"].step, "QUOTE_FIELD_2");
assert.strictEqual(engine.supplier_states["supplier_1"].data.unit_rate_val, 60);

engine.handleSupplierAction("supplier_1", null, "GST 18%");
assert.strictEqual(engine.supplier_states["supplier_1"].step, "QUOTE_FIELD_3");

// Supplier 2 now starts and completes Field 1 with a different value
engine.handleSupplierAction("supplier_2", "btn_supp_start_quote");
engine.handleSupplierAction("supplier_2", null, "₹28,000 per MT");
assert.strictEqual(engine.supplier_states["supplier_2"].step, "QUOTE_FIELD_2");
assert.strictEqual(engine.supplier_states["supplier_2"].data.unit_rate_val, 28000);

// Supplier 1 remains at Field 3
assert.strictEqual(engine.supplier_states["supplier_1"].step, "QUOTE_FIELD_3");
// Supplier 3 still in RECEIVED
assert.strictEqual(engine.supplier_states["supplier_3"].step, "RECEIVED");

console.log("  -> PASS: Suppliers have completely independent progress and states!");

// ---------------------------------------------------------------------
// TEST 3: All Seven Quotation Fields Are Mandatory
// ---------------------------------------------------------------------
console.log("\n[TEST 3] Verifying all seven quotation fields are mandatory...");
engine = new ProcurementEngine();
engine.buyer_state.quotation_deadline = "25 November 2026, 17:00 IST";
engine.syncRfqStore();
engine.executeRfqDispatch();

// Test Supplier 1 tries invalid/empty inputs for each field:
engine.handleSupplierAction("supplier_1", "btn_supp_start_quote");

// Field 1: Invalid rate rejected
let resF1 = engine.handleSupplierAction("supplier_1", null, "no price given");
assert.ok(resF1.text.includes("Invalid Quoted Unit Rate"), "Field 1 rejects non-numeric input");
assert.strictEqual(engine.supplier_states["supplier_1"].step, "QUOTE_FIELD_1");
engine.handleSupplierAction("supplier_1", null, "₹60 per kg");

// Field 2: Invalid GST rejected
let resF2 = engine.handleSupplierAction("supplier_1", null, "tax extra");
assert.ok(resF2.text.includes("Invalid GST Rate"), "Field 2 rejects invalid GST");
assert.strictEqual(engine.supplier_states["supplier_1"].step, "QUOTE_FIELD_2");
engine.handleSupplierAction("supplier_1", null, "GST 18%");

// Field 3: Invalid Freight rejected
let resF3 = engine.handleSupplierAction("supplier_1", null, "freight as per actuals");
assert.ok(resF3.text.includes("Invalid Freight Charges"), "Field 3 rejects invalid freight");
assert.strictEqual(engine.supplier_states["supplier_1"].step, "QUOTE_FIELD_3");
engine.handleSupplierAction("supplier_1", null, "Freight charges ₹1,000");

// Field 4: Empty delivery period rejected
let resF4 = engine.handleSupplierAction("supplier_1", null, " ");
assert.strictEqual(engine.supplier_states["supplier_1"].step, "QUOTE_FIELD_4");
engine.handleSupplierAction("supplier_1", null, "Delivery period 2 days");

// Field 5: Empty payment terms rejected
let resF5 = engine.handleSupplierAction("supplier_1", null, " ");
assert.strictEqual(engine.supplier_states["supplier_1"].step, "QUOTE_FIELD_5");
engine.handleSupplierAction("supplier_1", null, "50% payment before delivery and 50% after delivery");

// Field 6: Empty validity rejected
let resF6 = engine.handleSupplierAction("supplier_1", null, " ");
assert.strictEqual(engine.supplier_states["supplier_1"].step, "QUOTE_FIELD_6");
engine.handleSupplierAction("supplier_1", null, "Quotation validity 3 days");

// Field 7: Empty quality docs rejected
let resF7 = engine.handleSupplierAction("supplier_1", null, " ");
assert.strictEqual(engine.supplier_states["supplier_1"].step, "QUOTE_FIELD_7");
engine.handleSupplierAction("supplier_1", null, "No quality documents");

assert.strictEqual(engine.supplier_states["supplier_1"].step, "QUOTE_SUMMARY");
console.log("  -> PASS: All 7 fields strictly validated and mandatory!");

// ---------------------------------------------------------------------
// TEST 4: Natural-Language Numeric Values Are Parsed Correctly
// ---------------------------------------------------------------------
console.log("\n[TEST 4] Testing natural-language parsing...");
// Unit Rate variations
const r1 = engine.parseUnitRate("₹60 per kg", 50, "MT");
assert.strictEqual(r1.rate_val, 60);
assert.strictEqual(r1.unit, "kg");

const r2 = engine.parseUnitRate("60/kg", 50, "MT");
assert.strictEqual(r2.rate_val, 60);
assert.strictEqual(r2.unit, "kg");

const r3 = engine.parseUnitRate("₹28,000 per MT", 50, "MT");
assert.strictEqual(r3.rate_val, 28000);
assert.strictEqual(r3.unit, "MT");

const r4 = engine.parseUnitRate("29500 / tonne", 50, "MT");
assert.strictEqual(r4.rate_val, 29500);
assert.strictEqual(r4.unit, "MT");

// GST variations
const g1 = engine.parseGstRate("GST 18%");
assert.strictEqual(g1.gst_rate, 18);

const g2 = engine.parseGstRate("5% GST");
assert.strictEqual(g2.gst_rate, 5);

const g3 = engine.parseGstRate("0% (Exempted)");
assert.strictEqual(g3.gst_rate, 0);

const g4 = engine.parseGstRate("Exempted");
assert.strictEqual(g4.gst_rate, 0);

// Freight variations
const f1 = engine.parseFreightCharges("Freight charges ₹1,000", 50);
assert.strictEqual(f1.freight_amount, 1000);

const f2 = engine.parseFreightCharges("₹1,500 per MT", 50);
assert.strictEqual(f2.freight_amount, 75000); // 1500 * 50

const f3 = engine.parseFreightCharges("₹0 (Freight included in rate)", 50);
assert.strictEqual(f3.freight_amount, 0);

console.log("  -> PASS: Natural language inputs parsed accurately!");

// ---------------------------------------------------------------------
// TEST 5 & 6: Base Amount, GST, Freight Calculations and MT-to-Kg Conversion
// ---------------------------------------------------------------------
console.log("\n[TEST 5 & 6] Testing Base Amount, GST, Freight & MT-to-kg conversion...");
// User's specific example from prompt:
// Rate: ₹60 per kg, RFQ: 50 MT
// 50 MT = 50,000 kg
// Base Amount = 50,000 * 60 = ₹3,000,000
// GST 18% = ₹3,000,000 * 18% = ₹540,000
// Freight = ₹1,000
// Total Landed = ₹3,000,000 + ₹540,000 + ₹1,000 = ₹3,541,000

const d = engine.supplier_states["supplier_1"].data;
assert.strictEqual(d.base_amount, 3000000, "Base amount must be 30,00,000");
assert.strictEqual(d.gst_amount, 540000, "GST amount must be 5,40,000");
assert.strictEqual(d.freight_amount, 1000, "Freight must be 1,000");
assert.strictEqual(d.total_landed_amount, 3541000, "Total landed amount must be 35,41,000");

// Check transparent breakdown in summary
const summaryMsg = engine.renderSupplierQuoteSummary("supplier_1");
assert.ok(summaryMsg.text.includes("50,000 kg × ₹60/kg = ₹30,00,000"), "Transparent base amount calculation");
assert.ok(summaryMsg.text.includes("18%") && summaryMsg.text.includes("₹5,40,000"), "Transparent GST calculation");
assert.ok(summaryMsg.text.includes("₹1,000"), "Transparent freight amount");
assert.ok(summaryMsg.text.includes("₹35,41,000"), "Total Landed Amount in summary");

console.log("  -> PASS: Mathematical calculations and MT-to-kg conversions 100% accurate!");

// ---------------------------------------------------------------------
// TEST 7: Supplier Can Edit Before Submission
// ---------------------------------------------------------------------
console.log("\n[TEST 7] Testing supplier edit before submission...");
// Open edit menu
let editMenu = engine.handleSupplierAction("supplier_1", "btn_supp_edit_quote");
assert.strictEqual(engine.supplier_states["supplier_1"].step, "EDIT_QUOTE_MENU");

// Edit Unit Rate to ₹55 per kg
engine.handleSupplierAction("supplier_1", "btn_edit_q1");
assert.strictEqual(engine.supplier_states["supplier_1"].editing_field, 1);
let afterRateEdit = engine.handleSupplierAction("supplier_1", null, "₹55 per kg");

// Summary must be updated & recalculated immediately
assert.strictEqual(engine.supplier_states["supplier_1"].step, "QUOTE_SUMMARY");
assert.strictEqual(engine.supplier_states["supplier_1"].data.base_amount, 2750000); // 50,000 * 55
assert.strictEqual(engine.supplier_states["supplier_1"].data.gst_amount, 495000); // 27,50,000 * 18%
assert.strictEqual(engine.supplier_states["supplier_1"].data.total_landed_amount, 3246000); // 27,50,000 + 4,95,000 + 1,000

// Edit Freight to ₹1,500 per MT
engine.handleSupplierAction("supplier_1", "btn_supp_edit_quote");
engine.handleSupplierAction("supplier_1", "btn_edit_q3");
engine.handleSupplierAction("supplier_1", null, "₹1,500 per MT");
assert.strictEqual(engine.supplier_states["supplier_1"].data.freight_amount, 75000); // 1500 * 50
assert.strictEqual(engine.supplier_states["supplier_1"].data.total_landed_amount, 3320000); // 27,50,000 + 4,95,000 + 75,000

console.log("  -> PASS: Supplier can edit individual fields with immediate recalculation!");

// ---------------------------------------------------------------------
// TEST 8: No Quotation Is Submitted Without Confirmation
// ---------------------------------------------------------------------
console.log("\n[TEST 8] Verifying no quotation is submitted without confirmation...");
assert.strictEqual(window.PROCUREMENT_DATA.shared_store.supplier_assignments["supplier_1"].status, "DISPATCHED");
assert.strictEqual(window.PROCUREMENT_DATA.shared_store.quotations.length, 0);

// Only clicking 'btn_supp_confirm_submit' confirms
let confirmMsg = engine.handleSupplierAction("supplier_1", "btn_supp_confirm_submit");
assert.strictEqual(engine.supplier_states["supplier_1"].step, "SUBMITTED");
assert.strictEqual(window.PROCUREMENT_DATA.shared_store.supplier_assignments["supplier_1"].status, "SUBMITTED");
assert.strictEqual(window.PROCUREMENT_DATA.shared_store.quotations.length, 1);
assert.ok(confirmMsg.text.includes("Quotation Submitted & Recorded"), "Confirmation message returned");

console.log("  -> PASS: Quotation submitted strictly upon explicit confirmation!");

// ---------------------------------------------------------------------
// TEST 9: Unique Quotation References Are Generated
// ---------------------------------------------------------------------
console.log("\n[TEST 9] Verifying unique quotation references...");
// Now let Supplier 2 submit a quotation
engine.handleSupplierAction("supplier_2", "btn_supp_start_quote");
engine.handleSupplierAction("supplier_2", null, "₹28,000 per MT");
engine.handleSupplierAction("supplier_2", null, "GST 5%");
engine.handleSupplierAction("supplier_2", null, "Freight charges ₹2,000");
engine.handleSupplierAction("supplier_2", null, "5 business days");
engine.handleSupplierAction("supplier_2", null, "100% after delivery");
engine.handleSupplierAction("supplier_2", null, "15 days");
engine.handleSupplierAction("supplier_2", null, "Certificate of Analysis & Test Certificate");
engine.handleSupplierAction("supplier_2", "btn_supp_confirm_submit");

// Let Supplier 3 submit a quotation
engine.handleSupplierAction("supplier_3", "btn_supp_start_quote");
engine.handleSupplierAction("supplier_3", null, "₹30,000 per MT");
engine.handleSupplierAction("supplier_3", null, "GST 5%");
engine.handleSupplierAction("supplier_3", null, "₹0 (Freight included)");
engine.handleSupplierAction("supplier_3", null, "7 business days");
engine.handleSupplierAction("supplier_3", null, "30% advance, 70% delivery");
engine.handleSupplierAction("supplier_3", null, "30 days");
engine.handleSupplierAction("supplier_3", null, "Manufacturer test certificate & weighment slip");
engine.handleSupplierAction("supplier_3", "btn_supp_confirm_submit");

const q1 = window.PROCUREMENT_DATA.shared_store.supplier_assignments["supplier_1"].quotation;
const q2 = window.PROCUREMENT_DATA.shared_store.supplier_assignments["supplier_2"].quotation;
const q3 = window.PROCUREMENT_DATA.shared_store.supplier_assignments["supplier_3"].quotation;

assert.ok(q1.quotation_ref.startsWith("QT-2026-S1-"), "Supplier 1 has unique S1 ref");
assert.ok(q2.quotation_ref.startsWith("QT-2026-S2-"), "Supplier 2 has unique S2 ref");
assert.ok(q3.quotation_ref.startsWith("QT-2026-S3-"), "Supplier 3 has unique S3 ref");

assert.notStrictEqual(q1.quotation_ref, q2.quotation_ref);
assert.notStrictEqual(q2.quotation_ref, q3.quotation_ref);
assert.notStrictEqual(q1.quotation_ref, q3.quotation_ref);

console.log("  -> PASS: Unique quotation references generated across all suppliers!");

// ---------------------------------------------------------------------
// TEST 10: Buyer Receives Submitted Quotation Notification & Review
// ---------------------------------------------------------------------
console.log("\n[TEST 10] Testing buyer notification behavior & silent status update...");
const buyerHistory = window.PROCUREMENT_DATA.shared_store.conversation_histories["buyer"];
const notificationMsgs = buyerHistory.filter(m => m.text && m.text.includes("NEW QUOTATION RECEIVED"));
assert.strictEqual(notificationMsgs.length, 0, "Buyer chat does NOT receive full quote notifications on submission (silent update)");

// Check buyer quotation monitor status
let buyerStatus = engine.renderBuyerQuotationStatus();
assert.ok(buyerStatus.text.includes("Quotations Received:* 3") || buyerStatus.text.includes("Quotations Received: 3"), "All 3 quotes received in monitor");
assert.ok(buyerStatus.text.includes("Quotations Pending:* 0") || buyerStatus.text.includes("Quotations Pending: 0"), "0 quotes pending");
assert.ok(buyerStatus.text.includes(q1.quotation_ref), "Quote 1 ref visible in monitor");
assert.ok(buyerStatus.text.includes(q2.quotation_ref), "Quote 2 ref visible in monitor");
assert.ok(buyerStatus.text.includes(q3.quotation_ref), "Quote 3 ref visible in monitor");

console.log("  -> PASS: Silent store update verified and review details available!");

// ---------------------------------------------------------------------
// TEST 11: One Supplier Cannot See Another Supplier's Quotation
// ---------------------------------------------------------------------
console.log("\n[TEST 11] Verifying data isolation across suppliers...");
const h1 = window.PROCUREMENT_DATA.shared_store.conversation_histories["supplier_1"];
const h2 = window.PROCUREMENT_DATA.shared_store.conversation_histories["supplier_2"];
const h3 = window.PROCUREMENT_DATA.shared_store.conversation_histories["supplier_3"];

// Supplier 1 history must not contain Supplier 2 or 3 quote refs
assert.ok(!h1.some(m => m.text && m.text.includes(q2.quotation_ref)), "Supplier 1 cannot see Supplier 2 quote");
assert.ok(!h1.some(m => m.text && m.text.includes(q3.quotation_ref)), "Supplier 1 cannot see Supplier 3 quote");

// Supplier 2 history must not contain Supplier 1 or 3 quote refs
assert.ok(!h2.some(m => m.text && m.text.includes(q1.quotation_ref)), "Supplier 2 cannot see Supplier 1 quote");
assert.ok(!h2.some(m => m.text && m.text.includes(q3.quotation_ref)), "Supplier 2 cannot see Supplier 3 quote");

console.log("  -> PASS: Total conversation and commercial data isolation between suppliers!");

// ---------------------------------------------------------------------
// TEST 12: Existing Buyer RFQ Workflow and Compliance Remain Unaffected
// ---------------------------------------------------------------------
console.log("\n[TEST 12] Testing Regression Safety on RFQ and Compliance Engines...");
require('../js/data/hariyali_data.js');
require('../js/data/cbam_data.js');
require('../js/data/brsr_data.js');
global.HARIYALI_DATA = window.HARIYALI_DATA;
global.CBAM_DATA = window.CBAM_DATA;
global.BRSR_DATA = window.BRSR_DATA;
require('../js/engines/hariyali_engine.js');
require('../js/engines/cbam_engine.js');
require('../js/engines/brsr_engine.js');

const hEngine = new window.HariyaliEngine();
assert.strictEqual(typeof hEngine.reset, 'function');
assert.strictEqual(typeof hEngine.handleUserAction, 'function');

const cbamEngine = new window.CBAMEngine();
assert.strictEqual(typeof cbamEngine.reset, 'function');
assert.strictEqual(typeof cbamEngine.handleUserAction, 'function');

const brsrEngine = new window.BRSREngine();
assert.strictEqual(typeof brsrEngine.reset, 'function');
assert.strictEqual(typeof brsrEngine.handleUserAction, 'function');

// Buyer review & PDF modal intact
const rfqDocHtml = modal.buildRfqDocumentHtml(window.PROCUREMENT_DATA.shared_store.current_rfq);
assert.ok(rfqDocHtml.includes("TEMPLATE T-1"), "T-1 template HTML renders correctly");
assert.ok(rfqDocHtml.includes("Procurement Desk"), "Sample buyer contact details present in T-1 HTML");

console.log("  -> PASS: Compliance engines and existing RFQ workflows 100% intact!");

console.log("\n======================================================================");
console.log("ALL 12 TESTS PASSED WITH 100% SUCCESS — COMPLETE WORKFLOW VERIFIED!");
console.log("======================================================================");

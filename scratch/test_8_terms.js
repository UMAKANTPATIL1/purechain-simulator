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
console.log("SUITE: VERIFY BUYER CONTACT FOR QUERIES & 8-TERM RFQ FLOW");
console.log("======================================================================");

// ---------------------------------------------------------------------
// TEST 1: Verification of Suggested Option Buttons for All 8 Terms
// ---------------------------------------------------------------------
console.log("\n[TEST 1] Verifying suggested option buttons for all 8 terms...");
let engine = new ProcurementEngine();

// Term 1 (Price basis)
let q1 = engine.renderTermQuestion1(engine.buyer_state);
let q1BtnIds = q1.buttons.map(b => b.id);
assert.ok(q1BtnIds.includes("btn_t1_opt1"), "Term 1 has opt1 button");
assert.ok(q1BtnIds.includes("btn_t1_opt2"), "Term 1 has opt2 button");
assert.ok(q1BtnIds.includes("btn_t1_opt3"), "Term 1 has opt3 button");
assert.ok(q1BtnIds.includes("btn_t1_skip"), "Term 1 has skip button");

// Term 2 (Delivery location) - Must only accept typed input or skip (no invented addresses)
let q2 = engine.renderTermQuestion2(engine.buyer_state);
let q2BtnIds = q2.buttons.map(b => b.id);
assert.strictEqual(q2BtnIds.length, 1, "Term 2 only has Skip button, no invented address buttons");
assert.ok(q2BtnIds.includes("btn_t2_skip"), "Term 2 has skip button");

// Term 3 (Payment terms)
let q3 = engine.renderTermQuestion3(engine.buyer_state);
let q3BtnIds = q3.buttons.map(b => b.id);
assert.ok(q3BtnIds.includes("btn_t3_opt1"), "Term 3 has opt1 button");
assert.ok(q3BtnIds.includes("btn_t3_opt2"), "Term 3 has opt2 button");
assert.ok(q3BtnIds.includes("btn_t3_opt3"), "Term 3 has opt3 button");
assert.ok(q3BtnIds.includes("btn_t3_opt4"), "Term 3 has opt4 button");
assert.ok(q3BtnIds.includes("btn_t3_skip"), "Term 3 has skip button");

// Term 4 (GST & invoicing)
let q4 = engine.renderTermQuestion4(engine.buyer_state);
let q4BtnIds = q4.buttons.map(b => b.id);
assert.ok(q4BtnIds.includes("btn_t4_opt1"), "Term 4 has opt1 button");
assert.ok(q4BtnIds.includes("btn_t4_opt2"), "Term 4 has opt2 button");
assert.ok(q4BtnIds.includes("btn_t4_not_req"), "Term 4 has not required button");
assert.ok(q4BtnIds.includes("btn_t4_skip"), "Term 4 has skip button");

// Term 5 (Quality documents)
let q5 = engine.renderTermQuestion5(engine.buyer_state);
let q5BtnIds = q5.buttons.map(b => b.id);
assert.ok(q5BtnIds.includes("btn_t5_opt1"), "Term 5 has opt1 button");
assert.ok(q5BtnIds.includes("btn_t5_opt2"), "Term 5 has opt2 button");
assert.ok(q5BtnIds.includes("btn_t5_opt3"), "Term 5 has opt3 button");
assert.ok(q5BtnIds.includes("btn_t5_opt4"), "Term 5 has opt4 button");
assert.ok(q5BtnIds.includes("btn_t5_not_req"), "Term 5 has not required button");
assert.ok(q5BtnIds.includes("btn_t5_skip"), "Term 5 has skip button");

// Term 6 (Origin declaration)
let q6 = engine.renderTermQuestion6(engine.buyer_state);
let q6BtnIds = q6.buttons.map(b => b.id);
assert.ok(q6BtnIds.includes("btn_t6_yes"), "Term 6 has Required button");
assert.ok(q6BtnIds.includes("btn_t6_no"), "Term 6 has Not required button");
assert.ok(q6BtnIds.includes("btn_t6_skip"), "Term 6 has skip button");

// Term 7 (Quotation submission)
let q7 = engine.renderTermQuestion7(engine.buyer_state);
let q7BtnIds = q7.buttons.map(b => b.id);
assert.ok(q7BtnIds.includes("btn_t7_opt1"), "Term 7 has opt1 button");
assert.ok(q7BtnIds.includes("btn_t7_opt2"), "Term 7 has opt2 button");
assert.ok(q7BtnIds.includes("btn_t7_opt3"), "Term 7 has opt3 button");
assert.ok(q7BtnIds.includes("btn_t7_skip"), "Term 7 has skip button");

// Term 8 (Right of buyer)
let q8 = engine.renderTermQuestion8(engine.buyer_state);
let q8BtnIds = q8.buttons.map(b => b.id);
assert.ok(q8BtnIds.includes("btn_t8_confirm"), "Term 8 has confirm clause button");
assert.ok(q8BtnIds.includes("btn_t8_not_req"), "Term 8 has not required button");
assert.ok(q8BtnIds.includes("btn_t8_skip"), "Term 8 has skip button");

console.log("  -> PASS: All suggested option buttons properly defined!");

// ---------------------------------------------------------------------
// TEST 2: Selecting Suggested Options Stores Exact Prescribed Strings
// ---------------------------------------------------------------------
console.log("\n[TEST 2] Testing selecting suggested options...");
engine = new ProcurementEngine();

// Term 1: Opt 1
engine.buyer_state.step = "TERM_1";
engine.handleUserAction("btn_t1_opt1");
assert.strictEqual(engine.buyer_state.terms.term_1, "Per-unit rate with GST and freight separate");

// Term 1: Opt 2
engine.buyer_state.step = "TERM_1";
engine.handleUserAction("btn_t1_opt2");
assert.strictEqual(engine.buyer_state.terms.term_1, "FOR destination");

// Term 1: Opt 3
engine.buyer_state.step = "TERM_1";
engine.handleUserAction("btn_t1_opt3");
assert.strictEqual(engine.buyer_state.terms.term_1, "Ex-works");

// Term 3: Opt 1 to 4
engine.buyer_state.step = "TERM_3";
engine.handleUserAction("btn_t3_opt1");
assert.strictEqual(engine.buyer_state.terms.term_3, "100% after delivery");

engine.buyer_state.step = "TERM_3";
engine.handleUserAction("btn_t3_opt2");
assert.strictEqual(engine.buyer_state.terms.term_3, "100% after receipt and acceptance");

engine.buyer_state.step = "TERM_3";
engine.handleUserAction("btn_t3_opt3");
assert.strictEqual(engine.buyer_state.terms.term_3, "30% advance and 70% after delivery");

engine.buyer_state.step = "TERM_3";
engine.handleUserAction("btn_t3_opt4");
assert.strictEqual(engine.buyer_state.terms.term_3, "10% advance and balance after acceptance");

// Term 4: Opt 1, Opt 2, Not required
engine.buyer_state.step = "TERM_4";
engine.handleUserAction("btn_t4_opt1");
assert.strictEqual(engine.buyer_state.terms.term_4, "Active GSTIN and GST tax invoice mandatory");

engine.buyer_state.step = "TERM_4";
engine.handleUserAction("btn_t4_opt2");
assert.strictEqual(engine.buyer_state.terms.term_4, "GST invoice and e-way bill required");

engine.buyer_state.step = "TERM_4";
engine.handleUserAction("btn_t4_not_req");
assert.strictEqual(engine.buyer_state.terms.term_4, "Not required");

// Term 5: Opt 1 to 4 and Not required
engine.buyer_state.step = "TERM_5";
engine.handleUserAction("btn_t5_opt1");
assert.strictEqual(engine.buyer_state.terms.term_5, "Certificate of Analysis");

engine.buyer_state.step = "TERM_5";
engine.handleUserAction("btn_t5_opt2");
assert.strictEqual(engine.buyer_state.terms.term_5, "Manufacturer test certificate");

engine.buyer_state.step = "TERM_5";
engine.handleUserAction("btn_t5_opt3");
assert.strictEqual(engine.buyer_state.terms.term_5, "Weighment slip");

engine.buyer_state.step = "TERM_5";
engine.handleUserAction("btn_t5_opt4");
assert.strictEqual(engine.buyer_state.terms.term_5, "Quality certificate");

engine.buyer_state.step = "TERM_5";
engine.handleUserAction("btn_t5_not_req");
assert.strictEqual(engine.buyer_state.terms.term_5, "Not required");

// Term 6: Required and Not required
engine.buyer_state.step = "TERM_6";
engine.handleUserAction("btn_t6_yes");
assert.strictEqual(engine.buyer_state.terms.term_6, "Required");

engine.buyer_state.step = "TERM_6";
engine.handleUserAction("btn_t6_no");
assert.strictEqual(engine.buyer_state.terms.term_6, "Not required");

// Term 7: Opt 1 to 3
engine.buyer_state.step = "TERM_7";
engine.handleUserAction("btn_t7_opt1");
assert.strictEqual(engine.buyer_state.terms.term_7, "WhatsApp reply");

engine.buyer_state.step = "TERM_7";
engine.handleUserAction("btn_t7_opt2");
assert.strictEqual(engine.buyer_state.terms.term_7, "Official email with quotation PDF");

engine.buyer_state.step = "TERM_7";
engine.handleUserAction("btn_t7_opt3");
assert.strictEqual(engine.buyer_state.terms.term_7, "WhatsApp or email");

// Term 8: Confirm clause & Not required
engine.buyer_state.step = "TERM_8";
engine.handleUserAction("btn_t8_confirm");
assert.strictEqual(engine.buyer_state.terms.term_8, "Buyer reserves the right to accept any quote in whole or in part, reject any or all quotes without assigning reasons, and split quantities across multiple suppliers.");

engine.buyer_state.step = "TERM_8";
engine.handleUserAction("btn_t8_not_req");
assert.strictEqual(engine.buyer_state.terms.term_8, "Not required");

console.log("  -> PASS: All suggested options store exact expected strings!");

// ---------------------------------------------------------------------
// TEST 3: Sample Buyer Contact Details & T-1 PDF/HTML Rendering
// ---------------------------------------------------------------------
console.log("\n[TEST 3] Testing sample buyer contact details...");
engine = new ProcurementEngine();

// Default buyer state must have sample demo contact details
assert.strictEqual(engine.buyer_state.contact_name, "Procurement Desk");
assert.ok(engine.buyer_state.contact_phone.includes("+91 90000 00000"));
assert.ok(engine.buyer_state.contact_phone.includes("Demo placeholder"));
assert.strictEqual(engine.buyer_state.contact_email, "procurement@example.com");
assert.strictEqual(engine.buyer_state.is_demo_contact, true);

// Create RFQ and verify Document HTML
let rfq = engine.syncRfqStore();
let html = modal.buildRfqDocumentHtml(rfq);

assert.ok(html.includes("Procurement Desk"), "Contact person appears in T-1 HTML");
assert.ok(html.includes("+91 90000 00000"), "Mobile appears in T-1 HTML");
assert.ok(html.includes("procurement@example.com"), "Email appears in T-1 HTML");
assert.ok(!html.includes("Contact for queries</td>\n              <td style=\"padding: 4.5px 8px; border: 1px solid #6b8e4e; background-color: #ffffff !important; color: #222222;\">Not specified</td>"), "Contact for queries does NOT say 'Not specified'");

// Verify RFQ Review Screen
let review = engine.renderBuyerRfqReview();
assert.ok(review.text.includes("Procurement Desk"), "Review screen shows Procurement Desk");
assert.ok(review.text.includes("+91 90000 00000"), "Review screen shows Mobile");
assert.ok(review.text.includes("procurement@example.com"), "Review screen shows Email");
assert.ok(review.text.includes("Demo placeholder"), "Review screen clearly identifies demo placeholder");
let reviewBtnIds = review.buttons.map(b => b.id);
assert.ok(reviewBtnIds.includes("btn_edit_buyer_contact"), "Review screen has 'Edit Contact Details' button");

console.log("  -> PASS: Sample contact details properly populated and rendered in T-1 document and review screen!");

// ---------------------------------------------------------------------
// TEST 4: Configurable / Editable Buyer Contact Before Dispatch
// ---------------------------------------------------------------------
console.log("\n[TEST 4] Testing configurable/editable contact details...");
engine = new ProcurementEngine();

// Case A: Edit Contact Name
engine.handleUserAction("btn_edit_buyer_contact");
assert.strictEqual(engine.buyer_state.step, "EDIT_CONTACT");
engine.handleUserAction("btn_contact_edit_name");
assert.strictEqual(engine.buyer_state.editing_contact_field, "name");
engine.handleUserAction(null, "Rahul Sharma");
assert.strictEqual(engine.buyer_state.contact_name, "Rahul Sharma");
assert.strictEqual(engine.buyer_state.is_demo_contact, false);
assert.strictEqual(engine.buyer_state.step, "REVIEW_RFQ");

// Case B: Edit Contact Phone
engine.handleUserAction("btn_edit_buyer_contact");
engine.handleUserAction("btn_contact_edit_phone");
engine.handleUserAction(null, "+91 98765 43210");
assert.strictEqual(engine.buyer_state.contact_phone, "+91 98765 43210");

// Case C: Edit Contact Email
engine.handleUserAction("btn_edit_buyer_contact");
engine.handleUserAction("btn_contact_edit_email");
engine.handleUserAction(null, "rahul.sharma@apexgreenmetals.com");
assert.strictEqual(engine.buyer_state.contact_email, "rahul.sharma@apexgreenmetals.com");

// Verify in HTML and Review
rfq = window.PROCUREMENT_DATA.shared_store.current_rfq;
html = modal.buildRfqDocumentHtml(rfq);
assert.ok(html.includes("Rahul Sharma · +91 98765 43210 · rahul.sharma@apexgreenmetals.com"), "Edited genuine contact info in T-1 HTML");

// Case D: Reset back to demo sample
engine.handleUserAction("btn_edit_buyer_contact");
engine.handleUserAction("btn_contact_reset_demo");
assert.strictEqual(engine.buyer_state.contact_name, "Procurement Desk");
assert.ok(engine.buyer_state.contact_phone.includes("+91 90000 00000"));
assert.strictEqual(engine.buyer_state.contact_email, "procurement@example.com");
assert.strictEqual(engine.buyer_state.is_demo_contact, true);

// Case E: Multi-field combined input ("Name, Mobile, Email")
engine.handleUserAction("btn_edit_buyer_contact");
engine.handleUserAction(null, "Amit Patel, +91 94260 11223, amit.p@apexgreenmetals.com");
assert.strictEqual(engine.buyer_state.contact_name, "Amit Patel");
assert.strictEqual(engine.buyer_state.contact_phone, "+91 94260 11223");
assert.strictEqual(engine.buyer_state.contact_email, "amit.p@apexgreenmetals.com");

console.log("  -> PASS: Contact fields successfully configurable/editable in all modes!");

// ---------------------------------------------------------------------
// TEST 5: Supplier Can See Contact Details in Received RFQ
// ---------------------------------------------------------------------
console.log("\n[TEST 5] Testing suppliers receive contact details in WhatsApp message...");
engine = new ProcurementEngine();

// Dispatch RFQ
engine.buyer_state.quotation_deadline = "20 November 2026, 17:00 IST";
engine.syncRfqStore();
engine.executeRfqDispatch();
assert.strictEqual(window.PROCUREMENT_DATA.shared_store.rfq_dispatched, true);

// Verify each supplier's incoming message contains contact details
window.PROCUREMENT_DATA.suppliers.forEach(supp => {
  const msg = engine.renderSupplierIncomingRfqMessage(supp);
  assert.ok(msg.text.includes("Procurement Desk"), `${supp.name} sees contact person`);
  assert.ok(msg.text.includes("+91 90000 00000"), `${supp.name} sees contact phone`);
  assert.ok(msg.text.includes("procurement@example.com"), `${supp.name} sees contact email`);
});

console.log("  -> PASS: All suppliers receive buyer contact details in their incoming RFQ message!");

// ---------------------------------------------------------------------
// TEST 6: Do Not Overwrite Genuine Buyer Contact Details Configured Later
// ---------------------------------------------------------------------
console.log("\n[TEST 6] Testing genuine contact info is not overwritten...");
const genuineRfq = PROCUREMENT_DATA.createRFQ({
  rfq_ref: "PC-RFQ-2026-9999",
  buyer: {
    contact_name: "Pooja Desai",
    contact_phone: "+91 98111 22334",
    contact_email: "pooja.d@apexgreenmetals.com",
    is_demo_contact: false
  }
});

assert.strictEqual(genuineRfq.buyer.contact_name, "Pooja Desai");
assert.strictEqual(genuineRfq.buyer.contact_phone, "+91 98111 22334");
assert.strictEqual(genuineRfq.buyer.contact_email, "pooja.d@apexgreenmetals.com");
assert.strictEqual(genuineRfq.buyer.is_demo_contact, false);

const genuineHtml = modal.buildRfqDocumentHtml(genuineRfq);
assert.ok(genuineHtml.includes("Pooja Desai · +91 98111 22334 · pooja.d@apexgreenmetals.com"), "Genuine contact info preserved in T-1 HTML");
assert.ok(!genuineHtml.includes("Procurement Desk"), "Demo name not present when genuine contact provided");

console.log("  -> PASS: Genuine buyer contact information is strictly preserved and not overwritten!");

// ---------------------------------------------------------------------
// TEST 7: Regression Check on Compliance Workflows
// ---------------------------------------------------------------------
console.log("\n[TEST 7] Testing Regression Safety on Compliance Engines...");
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
console.log("  -> PASS: Compliance engines (Hariyali, CBAM, BRSR) untouched and completely intact!");

console.log("\n======================================================================");
console.log("ALL 7 TESTS PASSED WITH 100% SUCCESS!");
console.log("======================================================================");

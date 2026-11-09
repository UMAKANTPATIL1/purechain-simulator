/**
 * PureChain AI - RFQ Delivery Location Enhancement Test Suite (T-1, Term 2 of 8)
 * Verifies all 10 test scenarios specified in user requirements.
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
console.log("SUITE: RFQ DELIVERY LOCATION ENHANCEMENT (TERM 2 OF 8)");
console.log("======================================================================");

// -------------------------------------------------------------
// Test 1: Same as registered office with complete address
// -------------------------------------------------------------
console.log("\n[TEST 1] Same as registered office with complete address...");
{
  const engine = new ProcurementEngine();
  const s = engine.buyer_state;
  
  // Render Term 2 prompt
  const prompt = engine.renderTermQuestion2(s);
  assert.ok(prompt.text.includes("Term 2 of 8: Delivery Location"), "Must display Term 2 heading");
  assert.ok(prompt.text.includes("Where should the consignment be delivered?"), "Must ask where to deliver");
  assert.ok(prompt.text.includes("Please select one of the following options:"), "Must list options intro");
  
  // Verify 6 options and NO "Skip for now"
  assert.strictEqual(prompt.buttons.length, 6, "Must present exactly 6 structured options");
  assert.strictEqual(prompt.buttons[0].id, "btn_t2_same_registered");
  assert.strictEqual(prompt.buttons[1].id, "btn_t2_city_pune");
  assert.strictEqual(prompt.buttons[2].id, "btn_t2_city_mumbai");
  assert.strictEqual(prompt.buttons[3].id, "btn_t2_city_nashik");
  assert.strictEqual(prompt.buttons[4].id, "btn_t2_city_nagpur");
  assert.strictEqual(prompt.buttons[5].id, "btn_t2_other_location");
  assert.strictEqual(prompt.buttons.some(b => b.id.includes("skip")), false, "Must NOT have skip button");

  // Select Option 1
  const res = engine.handleBuyerAction("btn_t2_same_registered");
  assert.strictEqual(res.step, "TERM_3", "Must advance to Term 3 on complete registered office address");
  assert.strictEqual(s.delivery_location, "Plot No. 42, MIDC Industrial Area, Bhosari, Pune, Maharashtra - 411026");
  assert.strictEqual(s.terms.term_2, "Plot No. 42, MIDC Industrial Area, Bhosari, Pune, Maharashtra - 411026");
  assert.ok(s.delivery_location_details, "delivery_location_details must be populated");
  assert.strictEqual(s.delivery_location_details.selection_type, "same_as_registered");
  assert.strictEqual(s.delivery_location_details.pin_code, "411026");
  
  // Check that registered office address in buyer record was NOT overwritten
  assert.strictEqual(PROCUREMENT_DATA.buyer.registered_office_address, "Plot No. 42, MIDC Industrial Area, Bhosari, Pune, Maharashtra - 411026");
  console.log("  PASS: Option 1 sets delivery destination and advances to Term 3");
}

// -------------------------------------------------------------
// Test 2: Same as registered office with missing PIN code
// -------------------------------------------------------------
console.log("\n[TEST 2] Same as registered office with missing PIN code...");
{
  const engine = new ProcurementEngine();
  const s = engine.buyer_state;
  
  // Simulate registered office without PIN
  s.registered_office_address = "Plot No. 42, MIDC Industrial Area, Bhosari, Pune, Maharashtra";
  s.registered_office_pin = null;
  PROCUREMENT_DATA.buyer.registered_office_pin = null;
  PROCUREMENT_DATA.buyer.registered_office_address = "Plot No. 42, MIDC Industrial Area, Bhosari, Pune, Maharashtra";

  // Select Option 1
  const res = engine.handleBuyerAction("btn_t2_same_registered");
  assert.strictEqual(res.step, "TERM_2_REG_OFFICE_MISSING_PIN", "Must transition to missing PIN step");
  assert.ok(res.text.includes("The 6-digit PIN code is missing"), "Must prompt for missing PIN");

  // Buyer enters valid 6-digit PIN
  const pinRes = engine.handleBuyerAction(null, "411026");
  assert.strictEqual(pinRes.step, "TERM_3", "Must advance to Term 3 after PIN is entered");
  assert.strictEqual(s.delivery_location, "Plot No. 42, MIDC Industrial Area, Bhosari, Pune, Maharashtra - 411026");
  assert.strictEqual(s.delivery_location_details.pin_code, "411026");

  // Restore buyer record
  PROCUREMENT_DATA.buyer.registered_office_pin = "411026";
  PROCUREMENT_DATA.buyer.registered_office_address = "Plot No. 42, MIDC Industrial Area, Bhosari, Pune, Maharashtra - 411026";
  console.log("  PASS: Missing PIN was prompted for and combined correctly");
}

// -------------------------------------------------------------
// Test 3: Pune with complete address
// -------------------------------------------------------------
console.log("\n[TEST 3] Pune with complete address...");
{
  const engine = new ProcurementEngine();
  const s = engine.buyer_state;

  // Select Pune
  const prompt = engine.handleBuyerAction("btn_t2_city_pune");
  assert.strictEqual(prompt.step, "TERM_2_CITY_INPUT");
  assert.ok(prompt.text.includes("Pune, Maharashtra"));
  assert.ok(prompt.text.includes("Locality / area"));
  assert.ok(prompt.text.includes("Actual delivery address"));
  assert.ok(prompt.text.includes("6-digit PIN code"));

  // Buyer enters complete address
  const res = engine.handleBuyerAction(null, "Plot 15, Chakan Industrial Area Phase 2, Pune, Maharashtra - 410501");
  assert.strictEqual(res.step, "TERM_3", "Must advance to Term 3");
  assert.strictEqual(s.delivery_location, "Plot 15, Chakan Industrial Area Phase 2, Pune, Maharashtra - 410501");
  assert.strictEqual(s.delivery_location_details.city, "Pune");
  assert.strictEqual(s.delivery_location_details.state, "Maharashtra");
  assert.strictEqual(s.delivery_location_details.pin_code, "410501");
  console.log("  PASS: Pune complete address validated and saved");
}

// -------------------------------------------------------------
// Test 4: Mumbai with complete address
// -------------------------------------------------------------
console.log("\n[TEST 4] Mumbai with complete address...");
{
  const engine = new ProcurementEngine();
  const s = engine.buyer_state;

  // Select Mumbai
  const prompt = engine.handleBuyerAction("btn_t2_city_mumbai");
  assert.strictEqual(prompt.step, "TERM_2_CITY_INPUT");
  assert.ok(prompt.text.includes("Mumbai, Maharashtra"));

  // Buyer enters complete address
  const res = engine.handleBuyerAction(null, "Gala 102, APMC Market Yard 2, Turbhe, Navi Mumbai, Maharashtra - 400705");
  assert.strictEqual(res.step, "TERM_3");
  assert.strictEqual(s.delivery_location, "Gala 102, APMC Market Yard 2, Turbhe, Navi Mumbai, Maharashtra - 400705");
  assert.strictEqual(s.delivery_location_details.city, "Mumbai");
  assert.strictEqual(s.delivery_location_details.pin_code, "400705");
  console.log("  PASS: Mumbai complete address validated and saved");
}

// -------------------------------------------------------------
// Test 5: Other city with complete address
// -------------------------------------------------------------
console.log("\n[TEST 5] Other city with complete address...");
{
  const engine = new ProcurementEngine();
  const s = engine.buyer_state;

  // Select Other location
  const prompt = engine.handleBuyerAction("btn_t2_other_location");
  assert.strictEqual(prompt.step, "TERM_2_OTHER_INPUT");
  assert.ok(prompt.text.includes("Other Location"));

  // Buyer enters complete address
  const res = engine.handleBuyerAction(null, "Warehouse 4B, Sanand GIDC, Ahmedabad, Gujarat - 382110");
  assert.strictEqual(res.step, "TERM_3");
  assert.strictEqual(s.delivery_location, "Warehouse 4B, Sanand GIDC, Ahmedabad, Gujarat - 382110");
  assert.strictEqual(s.delivery_location_details.pin_code, "382110");
  console.log("  PASS: Other city complete address validated and saved");
}

// -------------------------------------------------------------
// Test 6: Invalid PIN code
// -------------------------------------------------------------
console.log("\n[TEST 6] Invalid PIN code...");
{
  const engine = new ProcurementEngine();
  const s = engine.buyer_state;

  engine.handleBuyerAction("btn_t2_city_pune");
  
  // Enter 5 digit PIN
  const res = engine.handleBuyerAction(null, "Plot 15 Chakan 41050");
  assert.strictEqual(res.step, "TERM_2_CITY_INPUT", "Must remain on city input");
  assert.ok(res.text.includes("Invalid PIN Code"), "Must display Invalid PIN warning");
  assert.strictEqual(s.delivery_location, null, "Must not set delivery location");

  // Enter PIN starting with 0
  const res2 = engine.handleBuyerAction(null, "Plot 15 Chakan 012345");
  assert.strictEqual(res2.step, "TERM_2_CITY_INPUT");
  assert.ok(res2.text.includes("Invalid PIN Code"));
  console.log("  PASS: Invalid PIN rejected with appropriate warning");
}

// -------------------------------------------------------------
// Test 7: City selected but address missing
// -------------------------------------------------------------
console.log("\n[TEST 7] City selected but address missing...");
{
  const engine = new ProcurementEngine();
  const s = engine.buyer_state;

  engine.handleBuyerAction("btn_t2_city_pune");

  // Type just city name
  const res = engine.handleBuyerAction(null, "Pune");
  assert.strictEqual(res.step, "TERM_2_CITY_INPUT");
  assert.ok(res.text.includes("A city name alone is not a complete delivery address"), "Must reject bare city name");

  // Type city name + state
  const res2 = engine.handleBuyerAction(null, "Pune, Maharashtra");
  assert.strictEqual(res2.step, "TERM_2_CITY_INPUT");
  assert.ok(res2.text.includes("A city name alone is not a complete delivery address"));

  // Type city name + PIN without street
  const res3 = engine.handleBuyerAction(null, "Pune 411001");
  assert.strictEqual(res3.step, "TERM_2_CITY_INPUT");
  assert.ok(res3.text.includes("Missing Information: Delivery Address"));
  console.log("  PASS: Bare city inputs rejected; requires actual premises/street address");
}

// -------------------------------------------------------------
// Test 8: Attempt to dispatch RFQ without a delivery location
// -------------------------------------------------------------
console.log("\n[TEST 8] Attempt to dispatch RFQ without delivery location...");
{
  const engine = new ProcurementEngine();
  const s = engine.buyer_state;
  PROCUREMENT_DATA.shared_store.rfq_dispatched = false;

  // Set deadline but leave delivery location null
  s.quotation_deadline = "15 November 2026, 15:00 IST";
  s.delivery_location = null;
  s.terms.term_2 = null;

  // Attempt dispatch
  const dispatchRes = engine.executeRfqDispatch();
  assert.strictEqual(dispatchRes.step, "MISSING_DELIVERY_LOCATION", "Must block dispatch");
  assert.ok(dispatchRes.text.includes("Cannot Dispatch: Delivery Location Required"));
  assert.strictEqual(dispatchRes.buttons[0].id, "btn_edit_t2");
  assert.strictEqual(PROCUREMENT_DATA.shared_store.rfq_dispatched, false, "Store must remain undispatched");

  // Click btn_edit_t2 to configure
  const t2Prompt = engine.handleBuyerAction("btn_edit_t2");
  assert.strictEqual(t2Prompt.step, "TERM_2");
  console.log("  PASS: Dispatch blocked until delivery location is confirmed");
}

// -------------------------------------------------------------
// Test 9: Navigate backward and forward without losing destination
// -------------------------------------------------------------
console.log("\n[TEST 9] Navigate backward and forward without losing destination...");
{
  const engine = new ProcurementEngine();
  const s = engine.buyer_state;

  // Step 1: select Nashik destination
  engine.handleBuyerAction("btn_t2_city_nashik");
  engine.handleBuyerAction(null, "Plot 24, Ambad MIDC, Near Garware Point, Nashik, Maharashtra - 422010");
  assert.strictEqual(s.delivery_location, "Plot 24, Ambad MIDC, Near Garware Point, Nashik, Maharashtra - 422010");

  // Step 2: Go to RFQ review
  s.quotation_deadline = "15 November 2026, 15:00 IST";
  const review = engine.renderBuyerRfqReview();
  assert.ok(review.text.includes("Plot 24, Ambad MIDC, Near Garware Point, Nashik, Maharashtra - 422010"));

  // Step 3: Open Term 2 edit menu
  const editPrompt = engine.handleBuyerAction("btn_edit_t2");
  assert.strictEqual(editPrompt.step, "TERM_2");
  assert.ok(editPrompt.text.includes("Plot 24, Ambad MIDC, Near Garware Point, Nashik, Maharashtra - 422010"));

  // Step 4: Cancel and return to review without changing
  const cancelRes = engine.handleBuyerAction("btn_back_to_review");
  assert.strictEqual(cancelRes.step, "REVIEW_RFQ");
  assert.strictEqual(s.delivery_location, "Plot 24, Ambad MIDC, Near Garware Point, Nashik, Maharashtra - 422010");
  assert.ok(cancelRes.text.includes("Plot 24, Ambad MIDC, Near Garware Point, Nashik, Maharashtra - 422010"));
  console.log("  PASS: Destination preserved accurately across navigation");
}

// -------------------------------------------------------------
// Test 10: Verify destination in supplier WhatsApp, T-1 PDF and T-3 PO
// -------------------------------------------------------------
console.log("\n[TEST 10] Verify destination in supplier WhatsApp, T-1 PDF, and T-3 PO...");
{
  const engine = new ProcurementEngine();
  const s = engine.buyer_state;
  PROCUREMENT_DATA.shared_store.rfq_dispatched = false;

  // Configure complete RFQ
  s.delivery_location = "Plot 15, Chakan Industrial Area Phase 2, Pune, Maharashtra - 410501";
  s.terms.term_1 = "Per-unit rate with GST and freight separate";
  s.terms.term_2 = "Plot 15, Chakan Industrial Area Phase 2, Pune, Maharashtra - 410501";
  s.terms.term_3 = "100% after receipt & acceptance";
  s.terms.term_4 = "Active GSTIN and GST tax invoice mandatory";
  s.terms.term_5 = "Certificate of Analysis (CoA) & Agmark inspection";
  s.terms.term_6 = "Mandatory Indian Origin certificate";
  s.terms.term_7 = "Via PureChain WhatsApp portal only";
  s.terms.term_8 = "Buyer reserves right to accept/reject/split";
  s.quotation_deadline = "15 November 2026, 15:00 IST";
  s.delivery_required_by = "18 November 2026";
  engine.syncRfqStore();

  // 10A: Verify Buyer Review
  const review = engine.renderBuyerRfqReview();
  assert.ok(review.text.includes("Plot 15, Chakan Industrial Area Phase 2, Pune, Maharashtra - 410501"));
  assert.ok(!review.text.includes("Not specified") || !review.text.includes("Delivery Location: Not specified"));

  // Dispatch RFQ
  const dispatchRes = engine.executeRfqDispatch();
  assert.strictEqual(dispatchRes.step, "DISPATCH_CONFIRMED");

  // 10B: Verify Supplier Incoming WhatsApp Message
  const supp1 = PROCUREMENT_DATA.suppliers[0];
  const suppMsg = engine.renderSupplierIncomingRfqMessage(supp1);
  const suppText = suppMsg.text;
  assert.ok(suppText.includes("Plot 15, Chakan Industrial Area Phase 2, Pune, Maharashtra - 410501"), "Supplier WhatsApp must show delivery destination");
  assert.ok(suppText.includes("📍 *Delivery Destination:* Plot 15, Chakan Industrial Area Phase 2, Pune, Maharashtra - 410501"));
  assert.ok(suppText.includes("2. *Delivery location:* Plot 15, Chakan Industrial Area Phase 2, Pune, Maharashtra - 410501"));
  assert.ok(!suppText.includes("Delivery Destination: Not specified"));

  // 10C: Verify T-1 RFQ Document PDF HTML
  const rfqDocHtml = modal.buildRfqDocumentHtml(PROCUREMENT_DATA.shared_store.current_rfq);
  assert.ok(rfqDocHtml.includes("Plot 15, Chakan Industrial Area Phase 2, Pune, Maharashtra - 410501"), "T-1 RFQ PDF must contain confirmed delivery location");
  assert.ok(!rfqDocHtml.includes("Delivery location</td>\n<td style=\"padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #ffffff !important; color: #222222;\">Not specified"));

  // 10D: Verify T-3 Purchase Order Generation & HTML
  const po = PROCUREMENT_DATA.createPurchaseOrder({
    rfq_ref: s.rfq_ref,
    supplier_id: "supplier_1",
    quantity: 50.0,
    unit: "MT",
    unit_rate_val: 28000,
    gst_rate: 5,
    freight_amount: 1000,
    delivery_address: s.delivery_location
  });

  assert.strictEqual(po.deliver_to.address, "Plot 15, Chakan Industrial Area Phase 2, Pune, Maharashtra - 410501");
  assert.strictEqual(po.deliver_to.pin, "410501");

  const poHtml = modal.buildPoDocumentHtml(po);
  assert.ok(poHtml.includes("Plot 15, Chakan Industrial Area Phase 2, Pune, Maharashtra - 410501"), "T-3 PO must display confirmed destination");
  assert.ok(poHtml.includes("Pin: 410501"), "T-3 PO must display extracted 6-digit PIN");
  assert.ok(!poHtml.includes("Deliver to: Not specified"));
  console.log("  PASS: Destination verified across Supplier WhatsApp, T-1 RFQ PDF, and T-3 PO");
}

console.log("\n======================================================================");
console.log("ALL 10 DELIVERY LOCATION WORKFLOW TESTS PASSED SUCCESSFULLY! (10/10)");
console.log("======================================================================\n");

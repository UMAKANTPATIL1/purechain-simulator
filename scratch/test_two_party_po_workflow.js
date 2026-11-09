/**
 * Test Suite: Two-Party PO Signing, Supplier Acceptance & Decline Workflow (Template T-3)
 *
 * Verifies:
 * 1. Stage 1 - Buyer review displays configured signatory name, approval status pending
 * 2. Stage 1 - Buyer clicking accept/sign shows confirmation dialog with exact prompt
 * 3. Stage 1 - Buyer cancel sign returns to review without dispatching
 * 4. Stage 1 - Buyer confirm sign records buyer signatory, timestamp, status SIGNED, document_version "buyer_signed"
 * 5. Stage 1 - Buyer chat displays dispatch confirmation awaiting supplier acceptance
 * 6. Stage 2 - Awarded supplier receives PO received card with all required metadata
 * 7. Stage 2 - Non-awarded suppliers strictly isolated (do not receive PO)
 * 8. Stage 3A - Supplier accepts PO: records supplier signatory name, timestamp, overall status ACCEPTED_BY_BOTH_PARTIES
 * 9. Stage 3A - Mutually accepted T-3 document contains BOTH digital signatures and timestamps
 * 10. Stage 3A - Universal document view: buyer and supplier see identical mutually accepted document
 * 11. Stage 3A - Milestone tracker marks commercial acceptance COMPLETED
 * 12. Stage 3B - Supplier decline confirmation dialog and cancel handling
 * 13. Stage 3B - Supplier confirm decline sets DECLINED_BY_SUPPLIER without supplier acceptance signature
 * 14. Stage 3B - Decline notice sent to buyer chat leaving decision in buyer's hands
 * 15. Stage 4 & 5 - Audit retention of document versions (draft, buyer_signed, mutually_accepted, declined)
 * 16. Stage 5 - Duplicate action protection: double accept, accept after decline, decline after accept, non-awarded supplier guard
 */

const assert = require("assert");

function resetFreshState() {
  delete require.cache[require.resolve("../js/data/procurement_data.js")];
  delete require.cache[require.resolve("../js/engines/procurement_engine.js")];

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

  PROCUREMENT_DATA.shared_store.current_po = null;
  PROCUREMENT_DATA.shared_store.current_po_document = null;
  PROCUREMENT_DATA.shared_store.selected_quotation = null;
  PROCUREMENT_DATA.shared_store.purchase_orders = [];
  PROCUREMENT_DATA.shared_store.conversation_histories = {
    buyer: [],
    supplier_1: [],
    supplier_2: [],
    supplier_3: []
  };
  PROCUREMENT_DATA.shared_store.supplier_assignments = {};

  const engine = new ProcurementEngine();

  // 1. Buyer creates RFQ
  engine.buyer_state.rfq_ref = "PC-RFQ-2026-0113";
  engine.buyer_state.quantity = 50.0;
  engine.buyer_state.unit = "MT";
  engine.buyer_state.technical_specs = "Grade A Red Onion (45-60mm), Moisture < 14%";
  engine.buyer_state.delivery_location = "Hazira Works, Hazira, Gujarat - 394270";
  engine.buyer_state.contact_name = "Rajesh Verma (Chief Procurement Officer)";
  engine.buyer_state.contact_phone = "+91 98200 55443";
  engine.buyer_state.contact_email = "r.verma@apexgreenmetals.com";
  engine.buyer_state.terms = {
    term_1: "Grade A Red Onion (45-60mm), Moisture < 14%",
    term_2: "Hazira Works, Hazira, Gujarat - 394270",
    term_3: "100% against delivery at destination",
    term_4: "Supplier scope (FOR Destination)",
    term_5: "Certificate of Analysis & Test Certificate",
    term_6: "7 days from receipt of RFQ",
    term_7: "Within 2 days of PO issuance",
    term_8: "18% GST extra as applicable"
  };
  engine.syncRfqStore();

  // 2. Submit quotations for supplier_2 and supplier_3
  // Supplier 2 (Ujjivan): ₹70.82/kg
  const s2State = engine.createInitialSupplierState("supplier_2");
  engine.supplier_states["supplier_2"] = s2State;
  s2State.data = {
    unit_rate_val: 70.82,
    unit_rate_unit: "kg",
    unit_rate_display: "₹70.82 / kg",
    qty_in_quoted_unit: 50000,
    base_amount: 3541000,
    calc_str: "50,000 kg × ₹70.82 / kg",
    gst_rate: 5,
    gst_display: "5%",
    gst_amount: 177050,
    freight_amount: 32000,
    freight_display: "₹32,000 fixed total freight",
    delivery_period: "2 days from PO issuance",
    payment_terms: "100% against delivery at destination",
    quotation_validity: "30 days from submission",
    quality_docs: "Certificate of Analysis & Test Certificate"
  };
  engine.executeSupplierQuoteSubmission("supplier_2");

  // Supplier 3 (Supplier Test): ₹28,000/MT, GST 18%, Freight 90,000 -> Total landed: ₹17,42,000
  const s3State = engine.createInitialSupplierState("supplier_3");
  engine.supplier_states["supplier_3"] = s3State;
  s3State.data = {
    unit_rate_val: 28000.0,
    unit_rate_unit: "MT",
    unit_rate_display: "₹28,000 / MT",
    qty_in_quoted_unit: 50,
    base_amount: 1400000,
    calc_str: "50 MT × ₹28,000 / MT",
    gst_rate: 18,
    gst_display: "18%",
    gst_amount: 252000,
    freight_amount: 90000,
    freight_display: "₹90,000 fixed total freight",
    delivery_period: "2 days from PO issuance",
    payment_terms: "100% against delivery at destination",
    quotation_validity: "30 days from submission",
    quality_docs: "Certificate of Analysis & Test Certificate"
  };
  engine.executeSupplierQuoteSubmission("supplier_3");

  // 3. Buyer generates comparison
  engine.executeGenerateComparison();

  return { engine, PROCUREMENT_DATA };
}

console.log("======================================================================");
console.log("SUITE: TWO-PARTY PO SIGNING, ACCEPTANCE & DECLINE WORKFLOW (TEMPLATE T-3)");
console.log("======================================================================");

// ---------------------------------------------------------------------
// TEST 1: Stage 1 - Buyer Review Shows Configured Signatory & Approval Status Pending
// ---------------------------------------------------------------------
console.log("\n[TEST 1] Testing Buyer Review shows configured Signatory & Approval Status Pending...");
{
  const { engine, PROCUREMENT_DATA } = resetFreshState();

  engine.handleBuyerAction("btn_buyer_start_po", null);
  engine.handleBuyerAction("btn_po_select_supplier_3", null);
  const reviewMsg = engine.handleBuyerAction("btn_po_confirm_full_qty", null);

  assert.strictEqual(engine.buyer_state.step, "PO_REVIEW");
  assert.strictEqual(engine.buyer_state.buyer_approval_status, "PENDING");
  assert.strictEqual(engine.buyer_state.po_approval_status, "PENDING");
  assert.strictEqual(PROCUREMENT_DATA.shared_store.current_po, null, "PO not yet created before explicit signing");

  assert.ok(reviewMsg.text.includes("Rajesh Verma (Chief Procurement Officer)"), "Displays buyer's configured signatory name");
  assert.ok(reviewMsg.text.includes("Pending buyer signature"), "Displays Approval Status: Pending buyer signature");
  assert.ok(reviewMsg.text.includes("Supplier Test"), "Displays selected supplier");
  assert.ok(reviewMsg.text.includes("INR 17,42,000.00"), "Displays total order value");

  const signBtn = reviewMsg.buttons.find(b => b.id === "btn_buyer_accept_sign_po");
  const previewBtn = reviewMsg.buttons.find(b => b.id === "btn_preview_po_doc");
  assert.ok(signBtn, "Review prompt includes [Accept & Sign Purchase Order] button");
  assert.ok(previewBtn, "Review prompt includes [View Purchase Order (T-3) PDF] button");

  console.log("  -> PASS: Buyer Review accurately displays signatory name, terms, and pending status!");
}

// ---------------------------------------------------------------------
// TEST 2: Stage 1 - Buyer Clicking Sign Shows Confirmation Dialog
// ---------------------------------------------------------------------
console.log("\n[TEST 2] Testing Buyer Sign Click opens explicit Confirmation Dialog...");
{
  const { engine, PROCUREMENT_DATA } = resetFreshState();

  engine.handleBuyerAction("btn_buyer_start_po", null);
  engine.handleBuyerAction("btn_po_select_supplier_3", null);
  engine.handleBuyerAction("btn_po_confirm_full_qty", null);

  const confirmPrompt = engine.handleBuyerAction("btn_buyer_accept_sign_po", null);
  assert.strictEqual(engine.buyer_state.step, "PO_SIGN_CONFIRM");
  assert.strictEqual(PROCUREMENT_DATA.shared_store.current_po, null, "PO remains uncreated during confirmation");

  assert.ok(confirmPrompt.text.includes("You are signing Purchase Order"), "Contains standard signing notice");
  assert.ok(confirmPrompt.text.includes("Rajesh Verma (Chief Procurement Officer)"), "Contains buyer signatory name");
  assert.ok(confirmPrompt.text.includes("Supplier Test"), "Contains selected supplier name");
  assert.ok(confirmPrompt.text.includes("sent to *Supplier Test* for acceptance") || confirmPrompt.text.includes("sent to Supplier Test for acceptance"), "Explains workflow to user");

  const confirmBtn = confirmPrompt.buttons.find(b => b.id === "btn_buyer_confirm_send_supplier");
  const cancelBtn = confirmPrompt.buttons.find(b => b.id === "btn_buyer_cancel_sign");
  assert.ok(confirmBtn, "Contains [Confirm & Send to Supplier] button");
  assert.ok(cancelBtn, "Contains [Cancel] button");

  console.log("  -> PASS: Signing confirmation prompt contains exact wording, signatories, and actions!");
}

// ---------------------------------------------------------------------
// TEST 3: Stage 1 - Buyer Cancel Returns to Review Without Dispatching
// ---------------------------------------------------------------------
console.log("\n[TEST 3] Testing Buyer Cancel returns to PO_REVIEW without dispatching...");
{
  const { engine, PROCUREMENT_DATA } = resetFreshState();

  engine.handleBuyerAction("btn_buyer_start_po", null);
  engine.handleBuyerAction("btn_po_select_supplier_3", null);
  engine.handleBuyerAction("btn_po_confirm_full_qty", null);
  engine.handleBuyerAction("btn_buyer_accept_sign_po", null);

  const backMsg = engine.handleBuyerAction("btn_buyer_cancel_sign", null);
  assert.strictEqual(engine.buyer_state.step, "PO_REVIEW");
  assert.strictEqual(engine.buyer_state.buyer_approval_status, "PENDING");
  assert.strictEqual(PROCUREMENT_DATA.shared_store.current_po, null, "PO still null after cancellation");

  const s3History = PROCUREMENT_DATA.shared_store.conversation_histories["supplier_3"] || [];
  const poMsgs = s3History.filter(m => m.text && m.text.includes("PURCHASE ORDER RECEIVED"));
  assert.strictEqual(poMsgs.length, 0, "No PO message sent to supplier after cancellation");

  console.log("  -> PASS: Cancellation safely returns to review with zero dispatch!");
}

// ---------------------------------------------------------------------
// TEST 4: Stage 1 - Buyer Confirm Sign Records Signatory, Timestamp & Dispatches PO
// ---------------------------------------------------------------------
console.log("\n[TEST 4] Testing Buyer Confirm Sign records signatory, timestamp, and dispatches PO...");
{
  const { engine, PROCUREMENT_DATA } = resetFreshState();

  engine.handleBuyerAction("btn_buyer_start_po", null);
  engine.handleBuyerAction("btn_po_select_supplier_3", null);
  engine.handleBuyerAction("btn_po_confirm_full_qty", null);
  engine.handleBuyerAction("btn_buyer_accept_sign_po", null);

  const dispatchMsg = engine.handleBuyerAction("btn_buyer_confirm_send_supplier", null);

  assert.strictEqual(engine.buyer_state.step, "PO_DISPATCHED");
  assert.strictEqual(engine.buyer_state.buyer_approval_status, "SIGNED");
  assert.strictEqual(engine.buyer_state.po_approval_status, "APPROVED");

  const po = PROCUREMENT_DATA.shared_store.current_po;
  assert.ok(po, "Purchase order created in shared store");
  assert.strictEqual(po.buyer_signatory_name, "Rajesh Verma (Chief Procurement Officer)");
  assert.ok(po.buyer_signed_at, "Buyer signed ISO timestamp recorded");
  assert.ok(po.buyer_signed_date, "Buyer signed formatted date recorded");
  assert.strictEqual(po.buyer_approval_status, "SIGNED");
  assert.strictEqual(po.overall_status, "AWAITING_SUPPLIER_RESPONSE");
  assert.strictEqual(po.document_version, "buyer_signed");
  assert.ok(po.document_versions.buyer_signed, "buyer_signed document version saved");

  assert.ok(dispatchMsg.text.includes("Sent to Supplier — Awaiting Acceptance"), "Buyer message announces awaiting supplier acceptance");
  assert.ok(dispatchMsg.text.includes("Rajesh Verma (Chief Procurement Officer)"), "Buyer message displays signatory name");

  console.log("  -> PASS: Buyer sign-off successfully recorded and document updated to buyer_signed!");
}

// ---------------------------------------------------------------------
// TEST 5: Stage 2 - Awarded Supplier Receives PO Card & Isolation of Non-Awarded Suppliers
// ---------------------------------------------------------------------
console.log("\n[TEST 5] Testing Awarded Supplier PO Card receipt and non-awarded supplier isolation...");
{
  const { engine, PROCUREMENT_DATA } = resetFreshState();

  engine.handleBuyerAction("btn_buyer_start_po", null);
  engine.handleBuyerAction("btn_po_select_supplier_3", null);
  engine.handleBuyerAction("btn_po_confirm_full_qty", null);
  engine.handleBuyerAction("btn_buyer_accept_sign_po", null);
  engine.handleBuyerAction("btn_buyer_confirm_send_supplier", null);

  const po = PROCUREMENT_DATA.shared_store.current_po;

  // Awarded supplier (supplier_3) received PO
  const s3History = PROCUREMENT_DATA.shared_store.conversation_histories["supplier_3"];
  const s3Msg = s3History.find(m => m.text && m.text.includes(po.po_ref));
  assert.ok(s3Msg, "Awarded supplier received PO message");
  assert.ok(s3Msg.text.includes("PURCHASE ORDER RECEIVED"), "Header states PURCHASE ORDER RECEIVED");
  assert.ok(s3Msg.text.includes(po.po_ref), "Contains PO reference");
  assert.ok(s3Msg.text.includes("Rajesh Verma (Chief Procurement Officer)"), "Contains Buyer Signatory name");
  assert.ok(s3Msg.text.includes("50 MT"), "Contains approved quantity");
  assert.ok(s3Msg.text.includes("INR 17,42,000.00"), "Contains total PO value");
  assert.ok(s3Msg.text.includes("Awaiting your acceptance"), "States status awaiting acceptance");

  const acceptBtn = s3Msg.buttons.find(b => b.id === "btn_supp_accept_po");
  const declineBtn = s3Msg.buttons.find(b => b.id === "btn_supp_decline_po");
  const viewPdfBtn = s3Msg.buttons.find(b => b.id === "btn_preview_po_doc");
  assert.ok(acceptBtn, "Contains [Accept Purchase Order] button");
  assert.ok(declineBtn, "Contains [Decline Purchase Order] button");
  assert.ok(viewPdfBtn, "Contains [View Purchase Order (T-3) PDF] button");

  // Non-awarded suppliers (supplier_1, supplier_2) must NOT receive PO
  const s1History = PROCUREMENT_DATA.shared_store.conversation_histories["supplier_1"] || [];
  const s2History = PROCUREMENT_DATA.shared_store.conversation_histories["supplier_2"] || [];
  assert.strictEqual(s1History.some(m => m.text && m.text.includes(po.po_ref)), false, "Supplier 1 isolated from PO");
  assert.strictEqual(s2History.some(m => m.text && m.text.includes(po.po_ref)), false, "Supplier 2 isolated from PO");

  console.log("  -> PASS: Awarded supplier received PO and other suppliers are strictly isolated!");
}

// ---------------------------------------------------------------------
// TEST 6: Stage 3A - Supplier Accepts PO: Signatures, Document Version & Chat Delivery
// ---------------------------------------------------------------------
console.log("\n[TEST 6] Testing Supplier Accepts PO workflow...");
{
  const { engine, PROCUREMENT_DATA } = resetFreshState();

  engine.handleBuyerAction("btn_buyer_start_po", null);
  engine.handleBuyerAction("btn_po_select_supplier_3", null);
  engine.handleBuyerAction("btn_po_confirm_full_qty", null);
  engine.handleBuyerAction("btn_buyer_accept_sign_po", null);
  engine.handleBuyerAction("btn_buyer_confirm_send_supplier", null);

  const po = PROCUREMENT_DATA.shared_store.current_po;

  // Supplier 3 accepts PO
  const acceptResult = engine.handleSupplierAction("supplier_3", "btn_supp_accept_po", null);

  assert.strictEqual(acceptResult.step, "PO_ACCEPTED");
  assert.ok(acceptResult.text.includes("PURCHASE ORDER ACCEPTED"), "Supplier message confirms acceptance");
  assert.ok(acceptResult.text.includes(po.po_ref), "Supplier message contains PO reference");
  assert.ok(acceptResult.text.includes("Amit Patel (Sales Director)"), "Supplier signatory name displayed");
  assert.ok(acceptResult.text.includes("Mutually Accepted by Both Parties"), "Status mutually accepted");

  // Verify shared PO object state
  assert.strictEqual(po.supplier_signatory_name, "Amit Patel (Sales Director)");
  assert.strictEqual(po.supplier_response_status, "ACCEPTED");
  assert.ok(po.supplier_response_at, "Supplier response ISO timestamp recorded");
  assert.ok(po.supplier_response_date, "Supplier response formatted date recorded");
  assert.strictEqual(po.overall_status, "ACCEPTED_BY_BOTH_PARTIES");
  assert.strictEqual(po.document_version, "mutually_accepted");
  assert.ok(po.document_versions.mutually_accepted, "Mutually accepted document version stored");

  // Verify notification was delivered to buyer's WhatsApp chat
  const buyerHistory = PROCUREMENT_DATA.shared_store.conversation_histories["buyer"];
  const buyerNotice = buyerHistory.find(m => m.text && m.text.includes("SUPPLIER ACCEPTED PURCHASE ORDER"));
  assert.ok(buyerNotice, "Buyer received incoming acceptance notification in chat history");
  assert.ok(buyerNotice.text.includes("Supplier Test"), "Notification includes supplier company name");
  assert.ok(buyerNotice.text.includes("Amit Patel (Sales Director)"), "Notification includes supplier signatory name");
  assert.ok(buyerNotice.text.includes(po.po_ref), "Notification includes PO reference");
  assert.ok(buyerNotice.buttons.find(b => b.id === "btn_preview_po_doc"), "Notification includes View Mutually Accepted PDF button");

  console.log("  -> PASS: Supplier acceptance fully recorded, document updated, and buyer notified!");
}

// ---------------------------------------------------------------------
// TEST 7: Stage 3A - Mutually Accepted T-3 PDF Displays Both Signatures & Dates
// ---------------------------------------------------------------------
console.log("\n[TEST 7] Verifying Mutually Accepted T-3 document renders both signatures and identical preview...");
{
  const { engine, PROCUREMENT_DATA } = resetFreshState();

  engine.handleBuyerAction("btn_buyer_start_po", null);
  engine.handleBuyerAction("btn_po_select_supplier_3", null);
  engine.handleBuyerAction("btn_po_confirm_full_qty", null);
  engine.handleBuyerAction("btn_buyer_accept_sign_po", null);
  engine.handleBuyerAction("btn_buyer_confirm_send_supplier", null);
  engine.handleSupplierAction("supplier_3", "btn_supp_accept_po", null);

  const po = PROCUREMENT_DATA.shared_store.current_po;
  const docHtml = po.document_html;

  // Buyer signature verification in HTML
  assert.ok(docHtml.includes("✍️ Signed: Rajesh Verma (Chief Procurement Officer)"), "Document contains Buyer digital signature representation");
  assert.ok(docHtml.includes(po.buyer_signed_date), "Document contains Buyer signed timestamp");

  // Supplier signature verification in HTML
  assert.ok(docHtml.includes("✍️ Accepted: Amit Patel (Sales Director)"), "Document contains Supplier digital signature representation");
  assert.ok(docHtml.includes(po.supplier_response_date), "Document contains Supplier signed timestamp");

  // Universal preview test: both buyer and supplier trigger preview
  engine.handleBuyerAction("btn_preview_po_doc", null);
  const buyerModalData = global.window.documentModal.lastData;

  engine.handleSupplierAction("supplier_3", "btn_preview_po_doc", null);
  const supplierModalData = global.window.documentModal.lastData;

  assert.strictEqual(buyerModalData.po_ref, supplierModalData.po_ref, "Both parties preview identical PO object");
  assert.strictEqual(buyerModalData.document_html, supplierModalData.document_html, "Both parties preview identical document HTML");

  console.log("  -> PASS: Mutually accepted document displays both signatures and identical preview for both parties!");
}

// ---------------------------------------------------------------------
// TEST 8: Stage 3A - Milestone Tracker Reflects Completed Commercial Acceptance
// ---------------------------------------------------------------------
console.log("\n[TEST 8] Verifying Milestone Tracker displays Completed Commercial Acceptance...");
{
  const { engine, PROCUREMENT_DATA } = resetFreshState();

  engine.handleBuyerAction("btn_buyer_start_po", null);
  engine.handleBuyerAction("btn_po_select_supplier_3", null);
  engine.handleBuyerAction("btn_po_confirm_full_qty", null);
  engine.handleBuyerAction("btn_buyer_accept_sign_po", null);
  engine.handleBuyerAction("btn_buyer_confirm_send_supplier", null);
  engine.handleSupplierAction("supplier_3", "btn_supp_accept_po", null);

  const po = PROCUREMENT_DATA.shared_store.current_po;
  const statusScreen = engine.handleBuyerAction("btn_buyer_check_po_status", null);

  assert.strictEqual(po.milestones[1].status, "COMPLETED");
  assert.ok(statusScreen.text.includes("2️⃣ *Supplier Commercial Acceptance:* 🟢 COMPLETED"), "Milestone 2 marked COMPLETED in tracker UI");
  assert.ok(statusScreen.buttons.find(b => b.text.includes("Mutually Accepted PO")), "Button updated to View Mutually Accepted PO");

  console.log("  -> PASS: Milestones tracker accurately updated to COMPLETED!");
}

// ---------------------------------------------------------------------
// TEST 9: Stage 3B - Supplier Decline Confirmation Dialog & Cancel
// ---------------------------------------------------------------------
console.log("\n[TEST 9] Testing Supplier Decline confirmation prompt and cancel...");
{
  const { engine, PROCUREMENT_DATA } = resetFreshState();

  engine.handleBuyerAction("btn_buyer_start_po", null);
  engine.handleBuyerAction("btn_po_select_supplier_3", null);
  engine.handleBuyerAction("btn_po_confirm_full_qty", null);
  engine.handleBuyerAction("btn_buyer_accept_sign_po", null);
  engine.handleBuyerAction("btn_buyer_confirm_send_supplier", null);

  const po = PROCUREMENT_DATA.shared_store.current_po;

  // Supplier clicks Decline
  const declinePrompt = engine.handleSupplierAction("supplier_3", "btn_supp_decline_po", null);
  assert.strictEqual(declinePrompt.step, "PO_DECLINE_CONFIRM");
  assert.ok(declinePrompt.text.includes("Are you sure you want to decline Purchase Order"), "Displays confirmation question");
  assert.ok(declinePrompt.text.includes(po.po_ref), "Displays PO number");

  const confirmDeclineBtn = declinePrompt.buttons.find(b => b.id === "btn_supp_confirm_decline_po");
  const cancelDeclineBtn = declinePrompt.buttons.find(b => b.id === "btn_supp_cancel_decline_po");
  assert.ok(confirmDeclineBtn, "Contains Confirm Decline button");
  assert.ok(cancelDeclineBtn, "Contains Cancel button");

  // Supplier clicks Cancel
  const cancelResult = engine.handleSupplierAction("supplier_3", "btn_supp_cancel_decline_po", null);
  assert.strictEqual(cancelResult.step, "PO_RECEIVED");
  assert.strictEqual(po.supplier_response_status, "PENDING", "Supplier response status remains PENDING");
  assert.ok(cancelResult.buttons.find(b => b.id === "btn_supp_accept_po"), "Accept button restored");
  assert.ok(cancelResult.buttons.find(b => b.id === "btn_supp_decline_po"), "Decline button restored");

  console.log("  -> PASS: Supplier decline confirmation dialog and cancellation safely handled!");
}

// ---------------------------------------------------------------------
// TEST 10: Stage 3B - Supplier Confirm Decline Updates Status & Retains Buyer-Signed Audit
// ---------------------------------------------------------------------
console.log("\n[TEST 10] Testing Supplier Confirm Decline workflow...");
{
  const { engine, PROCUREMENT_DATA } = resetFreshState();

  engine.handleBuyerAction("btn_buyer_start_po", null);
  engine.handleBuyerAction("btn_po_select_supplier_3", null);
  engine.handleBuyerAction("btn_po_confirm_full_qty", null);
  engine.handleBuyerAction("btn_buyer_accept_sign_po", null);
  engine.handleBuyerAction("btn_buyer_confirm_send_supplier", null);

  const po = PROCUREMENT_DATA.shared_store.current_po;
  const originalBuyerSignedHtml = po.document_versions.buyer_signed;
  assert.ok(originalBuyerSignedHtml, "Original buyer signed HTML stored");

  // Supplier confirms decline
  engine.handleSupplierAction("supplier_3", "btn_supp_decline_po", null);
  const declineResult = engine.handleSupplierAction("supplier_3", "btn_supp_confirm_decline_po", null);

  assert.strictEqual(declineResult.step, "PO_DECLINED");
  assert.ok(declineResult.text.includes("PURCHASE ORDER DECLINED"), "Supplier message confirms decline");
  assert.ok(declineResult.text.includes(po.po_ref), "Supplier message contains PO reference");

  // Verify PO store status
  assert.strictEqual(po.supplier_response_status, "DECLINED");
  assert.strictEqual(po.supplier_signatory_name, null, "Supplier signatory name must NOT be recorded upon decline");
  assert.ok(po.supplier_response_at, "Decline ISO timestamp recorded");
  assert.strictEqual(po.overall_status, "DECLINED_BY_SUPPLIER");
  assert.strictEqual(po.document_versions.mutually_accepted, undefined, "Mutually accepted PO must NOT be generated");
  assert.strictEqual(po.document_versions.buyer_signed, originalBuyerSignedHtml, "Original buyer-signed PO preserved for audit");

  // Verify buyer notification
  const buyerHistory = PROCUREMENT_DATA.shared_store.conversation_histories["buyer"];
  const buyerDeclineNotice = buyerHistory.find(m => m.text && m.text.includes("SUPPLIER DECLINED PURCHASE ORDER"));
  assert.ok(buyerDeclineNotice, "Buyer received decline notification in chat history");
  assert.ok(buyerDeclineNotice.text.includes("Supplier Test* has declined Purchase Order") || buyerDeclineNotice.text.includes("Supplier Test has declined Purchase Order"), "Notification clearly states supplier declined");
  assert.ok(buyerDeclineNotice.buttons.find(b => b.id === "btn_po_change_supplier"), "Buyer offered option to choose another supplier");

  // Milestone tracker verification
  const statusScreen = engine.handleBuyerAction("btn_buyer_check_po_status", null);
  assert.ok(statusScreen.text.includes("2️⃣ *Supplier Commercial Acceptance:* 🔴 DECLINED"), "Milestone 2 marked DECLINED in tracker UI");

  console.log("  -> PASS: Supplier decline properly updates status, audits buyer-signed PO, and leaves next step to buyer!");
}

// ---------------------------------------------------------------------
// TEST 11: Stage 5 - Duplicate Protection: Double Accept & Double Decline Prevention
// ---------------------------------------------------------------------
console.log("\n[TEST 11] Testing protection against duplicate acceptances & declines...");
{
  const { engine, PROCUREMENT_DATA } = resetFreshState();

  engine.handleBuyerAction("btn_buyer_start_po", null);
  engine.handleBuyerAction("btn_po_select_supplier_3", null);
  engine.handleBuyerAction("btn_po_confirm_full_qty", null);
  engine.handleBuyerAction("btn_buyer_accept_sign_po", null);
  engine.handleBuyerAction("btn_buyer_confirm_send_supplier", null);

  // Accept once
  engine.handleSupplierAction("supplier_3", "btn_supp_accept_po", null);
  const buyerHistoryLen = PROCUREMENT_DATA.shared_store.conversation_histories["buyer"].length;

  // Attempt to accept again
  const dupAcceptResult = engine.handleSupplierAction("supplier_3", "btn_supp_accept_po", null);
  assert.ok(dupAcceptResult.text.includes("Already Accepted"), "Warns supplier that PO is already accepted");
  assert.strictEqual(PROCUREMENT_DATA.shared_store.conversation_histories["buyer"].length, buyerHistoryLen, "Does not post duplicate message to buyer");

  // Attempt to decline after acceptance
  const postAcceptDeclineResult = engine.handleSupplierAction("supplier_3", "btn_supp_decline_po", null);
  assert.ok(postAcceptDeclineResult.text.includes("Cannot Decline") || postAcceptDeclineResult.text.includes("already been accepted"), "Prevents decline after acceptance");

  console.log("  -> PASS: Double-accept and decline-after-accept strictly prevented!");
}

// ---------------------------------------------------------------------
// TEST 12: Stage 5 - Duplicate Protection: Accept After Decline Prevention
// ---------------------------------------------------------------------
console.log("\n[TEST 12] Testing protection against accept after decline...");
{
  const { engine, PROCUREMENT_DATA } = resetFreshState();

  engine.handleBuyerAction("btn_buyer_start_po", null);
  engine.handleBuyerAction("btn_po_select_supplier_3", null);
  engine.handleBuyerAction("btn_po_confirm_full_qty", null);
  engine.handleBuyerAction("btn_buyer_accept_sign_po", null);
  engine.handleBuyerAction("btn_buyer_confirm_send_supplier", null);

  // Decline
  engine.handleSupplierAction("supplier_3", "btn_supp_decline_po", null);
  engine.handleSupplierAction("supplier_3", "btn_supp_confirm_decline_po", null);

  // Attempt to accept after decline
  const postDeclineAcceptResult = engine.handleSupplierAction("supplier_3", "btn_supp_accept_po", null);
  assert.ok(postDeclineAcceptResult.text.includes("Already Declined") || postDeclineAcceptResult.text.includes("cannot be accepted"), "Prevents accepting after decline");

  // Attempt to decline again
  const dupDeclineResult = engine.handleSupplierAction("supplier_3", "btn_supp_decline_po", null);
  assert.ok(dupDeclineResult.text.includes("Already Declined"), "Prevents duplicate decline");

  console.log("  -> PASS: Accept-after-decline and double-decline strictly prevented!");
}

// ---------------------------------------------------------------------
// TEST 13: Stage 5 - Unauthorized Supplier Protection
// ---------------------------------------------------------------------
console.log("\n[TEST 13] Testing Unauthorized Supplier Protection...");
{
  const { engine, PROCUREMENT_DATA } = resetFreshState();

  engine.handleBuyerAction("btn_buyer_start_po", null);
  engine.handleBuyerAction("btn_po_select_supplier_3", null);
  engine.handleBuyerAction("btn_po_confirm_full_qty", null);
  engine.handleBuyerAction("btn_buyer_accept_sign_po", null);
  engine.handleBuyerAction("btn_buyer_confirm_send_supplier", null);

  // Supplier 2 attempts to accept PO issued to Supplier 3
  const unauthorizedResult = engine.handleSupplierAction("supplier_2", "btn_supp_accept_po", null);
  assert.ok(unauthorizedResult.text.includes("Unauthorized") || unauthorizedResult.text.includes("not awarded"), "Blocks unauthorized supplier from accepting");

  console.log("  -> PASS: Non-awarded supplier is strictly prevented from accepting!");
}

console.log("\n======================================================================");
console.log("ALL 13 TWO-PARTY PO WORKFLOW TESTS PASSED WITH 100% SUCCESS!");
console.log("======================================================================");

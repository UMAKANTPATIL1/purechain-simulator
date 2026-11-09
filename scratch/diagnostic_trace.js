const assert = require("assert");

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

PROCUREMENT_DATA.initStore();
const engine = new ProcurementEngine();

// Buyer creates and dispatches RFQ
const rfq = PROCUREMENT_DATA.createRFQ({ commodity: "Onion", quantity: 50.0, unit: "MT", delivery_location: "Jaipur" });
PROCUREMENT_DATA.dispatchRFQ();

// Switch to Supplier 3
engine.switchParticipant("supplier_3");
engine.handleSupplierAction("supplier_3", "btn_supp_start_quote");
engine.handleSupplierAction("supplier_3", "btn_q_rate_opt2"); // ₹28,000 per MT
engine.handleSupplierAction("supplier_3", "btn_q_gst_opt1");  // GST 18%

// --- STAGE 1: Immediately after selecting freight option ---
const selectedFreightInput = "Freight charges ₹1,000"; // from btn_q_freight_opt1
const parsedFreightObject = engine.parseFreightCharges(selectedFreightInput, rfq.quantity);
engine.handleSupplierAction("supplier_3", "btn_q_freight_opt1"); // Freight charges ₹1,000

const suppState = engine.supplier_states["supplier_3"];
const draftFreightFields = {
  freight_amount: suppState.data.freight_amount,
  freight_type: suppState.data.freight_type,
  freight_display: suppState.data.freight_display,
  rate_per_mt: suppState.data.rate_per_mt,
  freight_amount_per_mt: suppState.data.freight_amount_per_mt
};

// Finish fields
engine.handleSupplierAction("supplier_3", "btn_q_deliv_opt1");
engine.handleSupplierAction("supplier_3", "btn_q_pay_opt1");
engine.handleSupplierAction("supplier_3", "btn_q_valid_opt1");
engine.handleSupplierAction("supplier_3", "btn_q_docs_opt4");

// Draft immediately before executeSupplierQuoteSubmission()
const draftBeforeSubmit = JSON.parse(JSON.stringify(engine.supplier_states["supplier_3"].data));

// Execute submission
engine.handleSupplierAction("supplier_3", "btn_supp_confirm_submit");

// Stored quotation
const storedQuotation = JSON.parse(JSON.stringify(PROCUREMENT_DATA.shared_store.supplier_assignments["supplier_3"].quotation));

// T-2 generation
engine.switchParticipant("buyer");
let t2InputQuotation = null;
let normalizedFreightResult = null;

// Intercept T-2 input by hooking normalizeFreight temporarily
const originalNormalizeFreight = PROCUREMENT_DATA.normalizeFreight.bind(PROCUREMENT_DATA);
PROCUREMENT_DATA.normalizeFreight = function(q, qty, unit) {
  if (q && (q.supplier_id === "supplier_3" || q.quotation_ref === storedQuotation.quotation_ref)) {
    t2InputQuotation = JSON.parse(JSON.stringify(q));
    normalizedFreightResult = originalNormalizeFreight(q, qty, unit);
    return normalizedFreightResult;
  }
  return originalNormalizeFreight(q, qty, unit);
};

const comp = PROCUREMENT_DATA.generateComparativeStatement();
const colS3 = comp.columns.find(c => c.supplier_id === "supplier_3");

console.log("======================================================================");
console.log("DIAGNOSTIC REPORT: SUPPLIER TEST FREIGHT FLOW TRACE");
console.log("======================================================================");

console.log("\n--- 1. RFQ Details ---");
console.log("RFQ Ref:", rfq.rfq_ref);
console.log("Material:", rfq.material);
console.log("Quantity & Unit:", rfq.quantity, rfq.unit);

console.log("\n--- 2. Supplier Chat Draft ---");
console.log("Selected freight input:", selectedFreightInput);
console.log("Parsed freight object:", JSON.stringify(parsedFreightObject));
console.log("Draft freight fields after selection:", JSON.stringify(draftFreightFields));
console.log("Draft totals before submit:", JSON.stringify({
  base_amount: draftBeforeSubmit.base_amount,
  gst_amount: draftBeforeSubmit.gst_amount,
  freight_amount: draftBeforeSubmit.freight_amount,
  total_landed_amount: draftBeforeSubmit.total_landed_amount
}));

console.log("\n--- 3. Actual Stored Quotation (PROCUREMENT_DATA.shared_store.supplier_assignments['supplier_3'].quotation) ---");
const fieldsToPrint = [
  "supplier_id", "quotation_ref", "revision", "unit_rate_val", "gst_rate",
  "gst_amount", "freight_amount", "freight_type", "freight_display",
  "freight_amount_per_mt", "freight_rate_per_mt", "rate_per_mt",
  "is_per_mt", "base_amount", "total_landed_amount"
];
fieldsToPrint.forEach(f => {
  console.log(`- ${f}:`, storedQuotation[f]);
});

console.log("\n--- 4. T-2 Input (Quotation object inside generateComparativeStatement() before normalizeFreight) ---");
console.log("Received quotation object keys:", Object.keys(t2InputQuotation));
console.log("Raw freight fields in T-2 input:");
console.log("- freight_amount:", t2InputQuotation.freight_amount);
console.log("- freight_type:", t2InputQuotation.freight_type);
console.log("- freight_display:", t2InputQuotation.freight_display);
console.log("- freight_amount_per_mt:", t2InputQuotation.freight_amount_per_mt);
console.log("- freight_rate_per_mt:", t2InputQuotation.freight_rate_per_mt);
console.log("- rate_per_mt:", t2InputQuotation.rate_per_mt);
console.log("- is_per_mt:", t2InputQuotation.is_per_mt);

console.log("\n--- 5. After normalizeFreight() in T-2 ---");
console.log("Normalized freight result:", JSON.stringify(normalizedFreightResult));
console.log("Calculated total landed cost:", colS3 ? colS3.total_landed_cost : null);
console.log("Calculated landed cost per kg:", colS3 ? colS3.normalized_landed_per_kg : null);
console.log("T-2 freight display:", colS3 ? colS3.freight_display : null);
console.log("T-2 total landed cost display:", colS3 ? colS3.total_landed_cost_display : null);

console.log("\n--- 6. Comparison Table ---");
console.log("| Stage | freight_amount | freight_type | freight_amount_per_mt | revision |");
console.log("|---|---:|---|---:|---|");
console.log(`| Supplier chat draft | ${draftBeforeSubmit.freight_amount} | ${draftBeforeSubmit.freight_type} | ${draftBeforeSubmit.freight_amount_per_mt || '-'} | Rev 0 |`);
console.log(`| Saved quotation | ${storedQuotation.freight_amount} | ${storedQuotation.freight_type} | ${storedQuotation.freight_amount_per_mt || '-'} | ${storedQuotation.revision} |`);
console.log(`| T-2 input | ${t2InputQuotation.freight_amount} | ${t2InputQuotation.freight_type} | ${t2InputQuotation.freight_amount_per_mt || '-'} | ${t2InputQuotation.revision} |`);
console.log(`| After normalizeFreight | ${normalizedFreightResult.freight_amount} | ${normalizedFreightResult.freight_type} | - | ${t2InputQuotation.revision} |`);


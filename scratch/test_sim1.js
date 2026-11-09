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
const PROCUREMENT_DATA = require('../js/data/procurement_data.js');
global.PROCUREMENT_DATA = PROCUREMENT_DATA;
window.PROCUREMENT_DATA = PROCUREMENT_DATA;
const ProcurementEngine = require('../js/engines/procurement_engine.js');

console.log("=== SIMULATION 1: EDIT BEFORE SUBMISSION (via btn_edit_q3) ===");
PROCUREMENT_DATA.initStore();
const engine1 = new ProcurementEngine();

// Buyer creates RFQ
engine1.buyer_state.active_rfq = PROCUREMENT_DATA.createRFQ({
  commodity: "Onion",
  quantity: 50.0,
  unit: "MT",
  delivery_location: "Hazira Works, Surat, Gujarat"
});
PROCUREMENT_DATA.dispatchRFQ();

// Switch to supplier_3
engine1.switchParticipant("supplier_3");
engine1.handleSupplierAction("supplier_3", "btn_supp_start_quote");
engine1.handleSupplierAction("supplier_3", "btn_q_rate_opt2");    // ₹28,000 per MT
engine1.handleSupplierAction("supplier_3", "btn_q_gst_opt1");     // GST 18%
engine1.handleSupplierAction("supplier_3", "btn_q_freight_opt2"); // ₹1,500 per MT!
engine1.handleSupplierAction("supplier_3", "btn_q_deliv_opt1");   // 2 days
engine1.handleSupplierAction("supplier_3", "btn_q_pay_opt1");     // 50%
engine1.handleSupplierAction("supplier_3", "btn_q_valid_opt1");   // 3 days
engine1.handleSupplierAction("supplier_3", "btn_q_docs_opt4");    // No docs

console.log("Before edit: suppState.data.freight_amount =", engine1.supplier_states["supplier_3"].data.freight_amount);
console.log("Before edit: suppState.data.freight_display =", engine1.supplier_states["supplier_3"].data.freight_display);
console.log("Before edit: suppState.data.freight_type =", engine1.supplier_states["supplier_3"].data.freight_type);
console.log("Before edit: suppState.data.rate_per_mt =", engine1.supplier_states["supplier_3"].data.rate_per_mt);

// Now edit field 3
console.log("User clicks btn_edit_q3...");
const editPrompt = engine1.handleSupplierAction("supplier_3", "btn_edit_q3");
console.log("User clicks btn_q_freight_opt1 (Freight charges ₹1,000)...");
const editResult = engine1.handleSupplierAction("supplier_3", "btn_q_freight_opt1");

console.log("After edit: suppState.data.freight_amount =", engine1.supplier_states["supplier_3"].data.freight_amount);
console.log("After edit: suppState.data.freight_display =", engine1.supplier_states["supplier_3"].data.freight_display);
console.log("After edit: suppState.data.freight_type =", engine1.supplier_states["supplier_3"].data.freight_type);
console.log("After edit: suppState.data.rate_per_mt =", engine1.supplier_states["supplier_3"].data.rate_per_mt);

// Now confirm submit
console.log("User clicks btn_supp_confirm_submit...");
engine1.handleSupplierAction("supplier_3", "btn_supp_confirm_submit");

const quote1 = PROCUREMENT_DATA.shared_store.supplier_assignments["supplier_3"].quotation;
console.log("Stored quotation in store:");
console.log("  freight_amount:", quote1.freight_amount);
console.log("  freight_display:", quote1.freight_display);
console.log("  freight_type:", quote1.freight_type);
console.log("  rate_per_mt:", quote1.rate_per_mt);
console.log("  total_landed_amount:", quote1.total_landed_amount);

// Now switch to buyer and generate comparison
engine1.switchParticipant("buyer");
const comp1 = PROCUREMENT_DATA.generateComparativeStatement();
const col1 = comp1.columns.find(c => c.supplier_id === "supplier_3");
console.log("T-2 comparison column for supplier_3:");
console.log("  freight_amount:", col1.freight_amount);
console.log("  freight_display:", col1.freight_display);
console.log("  total_landed_cost:", col1.total_landed_cost);
console.log("  landed_cost_per_unit_display:", col1.landed_cost_per_unit_display);

console.log("\n=== SIMULATION 2: EDIT AFTER SUBMISSION ===");
// Supplier 3 already submitted in engine1.
// Now what if the user tries to change freight?
console.log("Current assign status:", PROCUREMENT_DATA.shared_store.supplier_assignments["supplier_3"].status);
// Suppose the supplier tries to click something or submit again:
const res = engine1.handleSupplierAction("supplier_3", "btn_supp_start_quote");
console.log("handleSupplierAction btn_supp_start_quote returns:", res ? res.text : "null");

/**
 * Purechain AI — Multi-User Procurement Data & Shared State Store (Stage 1)
 *
 * Implements the centralized in-memory procurement store for:
 * 1. Participants (Buyer + 3 Verified Suppliers)
 * 2. RFQ records & 9 official statutory terms
 * 3. Supplier assignments & status tracking
 * 4. Quotations received
 * 5. Independent conversation histories for all participants
 */

const PROCUREMENT_DATA = {
  buyer: {
    id: "buyer",
    name: "Apex Green Metals Pvt Ltd",
    short_name: "Apex Green Metals",
    role: "Buyer",
    plant_name: null,
    location: "Pune, Maharashtra",
    delivery_address: null,
    registered_office_address: "Plot No. 42, MIDC Industrial Area, Bhosari, Pune, Maharashtra - 411026",
    registered_office_pin: "411026",
    registered_office_city: "Pune",
    registered_office_state: "Maharashtra",
    registered_office_locality: "Bhosari MIDC",
    registered_address: "Plot No. 42, MIDC Industrial Area, Bhosari, Pune, Maharashtra - 411026",
    state: "Maharashtra",
    gstin: null,
    contact_name: "Procurement Desk",
    authorized_signatory: null,
    contact_phone: "+91 90000 00000 (Demo placeholder)",
    contact_email: "procurement@example.com",
    is_demo_contact: true,
    avatar: "🏢"
  },

  suppliers: [
    {
      id: "supplier_1",
      name: "Test Supplier Pvt Ltd",
      short_name: "Test Supplier",
      contact_name: "Rajesh Sharma (Commercial Head)",
      contact_phone: "+91 98230 11223",
      role: "Supplier 1",
      location: "Pune, Maharashtra",
      gst_status: "Verified",
      past_performance: "New",
      rakshak_status: "GST verification unavailable (Demo)",
      daam_guru_status: null,
      match: "Onion",
      avatar: "🏬"
    },
    {
      id: "supplier_2",
      name: "UJJIVAN SMALL FINANCE BANK LIMITED",
      short_name: "UJJIVAN BANK",
      contact_name: "Debashish Roy (Branch Ops Manager)",
      contact_phone: "+91 94350 44556",
      role: "Supplier 2",
      location: "Dispur, Assam",
      gst_status: "Verified",
      past_performance: "Good",
      rakshak_status: "GST verified (Demo)",
      daam_guru_status: null,
      match: "Onion",
      avatar: "🏦"
    },
    {
      id: "supplier_3",
      name: "Supplier Test",
      short_name: "Supplier Test",
      contact_name: "Amit Patel (Sales Director)",
      contact_phone: "+91 98765 43210",
      role: "Supplier 3",
      location: "Mumbai, Maharashtra",
      gst_status: "Verified",
      past_performance: "Good",
      rakshak_status: "GST verification unavailable (Demo)",
      daam_guru_status: null,
      match: "Onion",
      avatar: "🏭"
    }
  ],

  materials: [
    {
      id: "mat_onion",
      name: "Onion",
      display_name: "Onion (Fresh Red Onion)",
      default_qty: 50.0,
      unit: "Metric Tonnes (MT)",
      specs_summary: "Grade A Red Onion (45-60mm), Moisture < 14%, 50 kg mesh bags",
      specs: {
        variety: "Nashik / Lasalgaon Red Onion (Grade A)",
        size: "45 mm to 60 mm diameter",
        moisture: "< 14.0%",
        quality: "Sound, free from decay, rot, and premature sprouting",
        packaging: "50 kg ventilated red mesh leno bags"
      }
    }
  ],

  // Official 8 Terms of this RFQ from Template T-1 (Page 2)
  rfq_terms: [
    {
      id: 1,
      term: "Price basis",
      requirement: "Quote per-unit rate, GST % shown separately, and freight/delivery charges (if any) separately. State FOR destination or ex-works."
    },
    {
      id: 2,
      term: "Delivery location",
      requirement: "____________________ (address / pin code)"
    },
    {
      id: 3,
      term: "Payment terms offered",
      requirement: "____ % advance; balance ____ days after receipt & acceptance"
    },
    {
      id: 4,
      term: "GST & invoicing",
      requirement: "Supplier must hold an active GSTIN and issue a GST-compliant tax invoice."
    },
    {
      id: 5,
      term: "Quality documents",
      requirement: "Test certificate / CoA / brand warranty as applicable — state what you will provide."
    },
    {
      id: 6,
      term: "Origin declaration",
      requirement: "Supplier may be asked to declare material origin (needed for our export compliance — CBAM/EUDR)."
    },
    {
      id: 7,
      term: "How to submit",
      requirement: "Reply on WhatsApp to the number above, or email. Photo of a signed quotation is acceptable."
    },
    {
      id: 8,
      term: "Right of buyer",
      requirement: "Buyer may accept in part, split quantities, or reject all quotes without assigning reasons."
    }
  ],

  // Demo quotation presets for suppliers (clearly labelled demo sample values)
  demo_quotes: {
    supplier_1: [
      {
        id: "demo_q1_a",
        label: "Sample Quote A: ₹28,000/MT (₹28/kg), 5% GST, 5d Delivery",
        unit_price_per_mt: 28000.0,
        unit_price_display: "₹28,000 / MT (₹28 / kg)",
        gst_rate_percent: 5.0,
        freight_amount_per_mt: 1500.0,
        freight_display: "₹1,500 / MT (Pune to Hazira)",
        delivery_timeline: "5 business days",
        quotation_validity: "15 days",
        remarks: "Sample Demo Offer: Grade A Nashik Red Onion sortex cleaned, prompt dispatch"
      },
      {
        id: "demo_q1_b",
        label: "Sample Quote B: ₹26,500/MT (₹26.5/kg), 5% GST, 8d Delivery",
        unit_price_per_mt: 26500.0,
        unit_price_display: "₹26,500 / MT (₹26.5 / kg)",
        gst_rate_percent: 5.0,
        freight_amount_per_mt: 1800.0,
        freight_display: "₹1,800 / MT",
        delivery_timeline: "8 business days",
        quotation_validity: "20 days",
        remarks: "Sample Demo Offer: Standard Lasalgaon grade"
      }
    ],
    supplier_2: [
      {
        id: "demo_q2_a",
        label: "Sample Quote A: ₹30,000/MT (₹30/kg), 5% GST, 7d Delivery",
        unit_price_per_mt: 30000.0,
        unit_price_display: "₹30,000 / MT (₹30 / kg)",
        gst_rate_percent: 5.0,
        freight_amount_per_mt: 2200.0,
        freight_display: "₹2,200 / MT (Assam to Hazira Rail Transit)",
        delivery_timeline: "7 business days",
        quotation_validity: "15 days",
        remarks: "Sample Demo Offer: Certified organic quality produce"
      },
      {
        id: "demo_q2_b",
        label: "Sample Quote B: ₹27,500/MT (₹27.5/kg), 5% GST, 10d Delivery",
        unit_price_per_mt: 27500.0,
        unit_price_display: "₹27,500 / MT (₹27.5 / kg)",
        gst_rate_percent: 5.0,
        freight_amount_per_mt: 2500.0,
        freight_display: "₹2,500 / MT",
        delivery_timeline: "10 business days",
        quotation_validity: "20 days",
        remarks: "Sample Demo Offer: Bulk farm-gate collection"
      }
    ],
    supplier_3: [
      {
        id: "demo_q3_a",
        label: "Sample Quote A: ₹27,000/MT (₹27/kg), 5% GST, 4d Delivery",
        unit_price_per_mt: 27000.0,
        unit_price_display: "₹27,000 / MT (₹27 / kg)",
        gst_rate_percent: 5.0,
        freight_amount_per_mt: 1200.0,
        freight_display: "₹1,200 / MT (Mumbai APMC to Hazira)",
        delivery_timeline: "4 business days (Fast Express)",
        quotation_validity: "12 days",
        remarks: "Sample Demo Offer: Ready stock at Vashi cold storage"
      },
      {
        id: "demo_q3_b",
        label: "Sample Quote B: ₹25,500/MT (₹25.5/kg), 5% GST, 7d Delivery",
        unit_price_per_mt: 25500.0,
        unit_price_display: "₹25,500 / MT (₹25.5 / kg)",
        gst_rate_percent: 5.0,
        freight_amount_per_mt: 1400.0,
        freight_display: "₹1,400 / MT",
        delivery_timeline: "7 business days",
        quotation_validity: "15 days",
        remarks: "Sample Demo Offer: Standard market consignment"
      }
    ]
  },

  // Centralized In-Memory Store
  shared_store: {
    current_rfq_ref: "PC-RFQ-2026-0113",
    current_rfq: null,
    rfq_dispatched: false,
    selected_supplier_ids: ["supplier_1", "supplier_2", "supplier_3"],
    supplier_assignments: {
      supplier_1: { status: "NOT_DISPATCHED", quotation: null },
      supplier_2: { status: "NOT_DISPATCHED", quotation: null },
      supplier_3: { status: "NOT_DISPATCHED", quotation: null }
    },
    quotations: [],
    comparison_reports: {},
    current_comparison: null,
    current_comparison_ref: null,
    current_po: null,
    purchase_orders: [],
    selected_quotation: null,
    conversation_histories: {
      buyer: [],
      supplier_1: [],
      supplier_2: [],
      supplier_3: []
    },
    unread_counts: {
      buyer: 0,
      supplier_1: 0,
      supplier_2: 0,
      supplier_3: 0
    },
    last_snippets: {
      buyer: "Buyer • RFQ Desk",
      supplier_1: "Supplier 1 • Verified",
      supplier_2: "Supplier 2 • Verified",
      supplier_3: "Supplier 3 • Verified"
    }
  },

  // Store Management Methods
  initStore: function() {
    const currentYear = new Date().getFullYear();
    this.shared_store = {
      current_rfq_ref: `PC-RFQ-${currentYear}-0113`,
      current_rfq: null,
      rfq_dispatched: false,
      selected_supplier_ids: ["supplier_1", "supplier_2", "supplier_3"],
      supplier_assignments: {
        supplier_1: { status: "NOT_DISPATCHED", quotation: null },
        supplier_2: { status: "NOT_DISPATCHED", quotation: null },
        supplier_3: { status: "NOT_DISPATCHED", quotation: null }
      },
      quotations: [],
      comparison_reports: {},
      current_comparison: null,
      current_comparison_ref: null,
      current_po: null,
      purchase_orders: [],
      selected_quotation: null,
      conversation_histories: {
        buyer: [],
        supplier_1: [],
        supplier_2: [],
        supplier_3: []
      },
      unread_counts: {
        buyer: 0,
        supplier_1: 0,
        supplier_2: 0,
        supplier_3: 0
      },
      last_snippets: {
        buyer: "Buyer • RFQ Desk",
        supplier_1: "Supplier 1 • Verified",
        supplier_2: "Supplier 2 • Verified",
        supplier_3: "Supplier 3 • Verified"
      }
    };
  },

  getSupplierById: function(supplierId) {
    return this.suppliers.find(s => s.id === supplierId);
  },

  createRFQ: function(params) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const defaultRef = `PC-RFQ-${currentYear}-0113`;
    const rfqRef = (params && params.rfq_ref) || (this.shared_store && this.shared_store.current_rfq_ref) || defaultRef;
    if (this.shared_store) {
      this.shared_store.current_rfq_ref = rfqRef;
    }
    const rfqDateDisplay = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    const p = params || {};
    const tCfg = p.terms_config || p.terms || {};

    const term1 = tCfg.term_1 ?? p.term_1 ?? null;
    const term2 = p.delivery_location ?? tCfg.term_2 ?? p.term_2 ?? null;
    const term3 = p.payment_terms ?? tCfg.term_3 ?? p.term_3 ?? null;
    const term4 = tCfg.term_4 ?? p.term_4 ?? null;
    const term5 = tCfg.term_5 ?? p.term_5 ?? null;
    const term6 = tCfg.term_6 ?? p.term_6 ?? null;
    const term7 = tCfg.term_7 ?? p.term_7 ?? null;
    const term8 = tCfg.term_8 ?? p.term_8 ?? null;

    const termsConfig = {
      term_1: term1,
      term_2: term2,
      term_3: term3,
      term_4: term4,
      term_5: term5,
      term_6: term6,
      term_7: term7,
      term_8: term8
    };

    // Build the 8 official terms with buyer-configured values
    const terms = [
      { id: 1, term: "Price basis", requirement: term1 },
      { id: 2, term: "Delivery location", requirement: term2 },
      { id: 3, term: "Payment terms offered", requirement: term3 },
      { id: 4, term: "GST & invoicing", requirement: term4 },
      { id: 5, term: "Quality documents", requirement: term5 },
      { id: 6, term: "Origin declaration", requirement: term6 },
      { id: 7, term: "How to submit", requirement: term7 },
      { id: 8, term: "Right of buyer", requirement: term8 }
    ];

    if (p.buyer) {
      Object.assign(this.buyer, p.buyer);
    }

    const rfq = {
      rfq_ref: rfqRef,
      created_at: today.toISOString(),
      date_display: rfqDateDisplay,
      buyer: { ...this.buyer, ...(p.buyer || {}) },
      material: p.material || (this.materials[0] ? this.materials[0].name : "Onion"),
      material_id: p.material_id || "mat_onion",
      quantity: (p.quantity != null) ? p.quantity : 50.0,
      unit: p.unit || "MT",
      technical_specs: p.technical_specs || (this.materials[0] ? this.materials[0].specs_summary : ""),
      detailed_specs: this.materials[0] ? this.materials[0].specs : {},
      delivery_location: term2,
      delivery_location_details: p.delivery_location_details || null,
      quotation_deadline: p.quotation_deadline || null,
      quote_validity: p.quote_validity || null,
      payment_terms: term3,
      delivery_required_by: p.delivery_required_by || null,
      terms_config: termsConfig,
      terms: terms,
      selected_suppliers: [...this.shared_store.selected_supplier_ids],
      status: "DRAFT"
    };

    if (term2 && term2 !== "Not specified") {
      this.buyer.delivery_address = term2;
    }

    this.shared_store.current_rfq = rfq;
    return rfq;
  },

  dispatchRFQ: function() {
    if (!this.shared_store.current_rfq) return null;
    if (this.shared_store.rfq_dispatched) return this.shared_store.current_rfq;

    const rfq = this.shared_store.current_rfq;
    rfq.status = "DISPATCHED";
    rfq.dispatched_at = new Date().toISOString();
    this.shared_store.rfq_dispatched = true;

    // Create assignment for every selected supplier
    rfq.selected_suppliers.forEach(suppId => {
      this.shared_store.supplier_assignments[suppId] = {
        status: "DISPATCHED",
        quotation: null,
        dispatched_at: new Date().toISOString()
      };
      this.shared_store.unread_counts[suppId] = 1;
      this.shared_store.last_snippets[suppId] = `📥 New RFQ: ${rfq.rfq_ref}`;
    });

    return rfq;
  },

  submitQuotation: function(supplierId, quoteParams) {
    const rfq = this.shared_store.current_rfq;
    if (!rfq) return null;

    // Prevent duplicate submissions unless explicitly updating or submitting a new reference/revision
    const existing = this.shared_store.supplier_assignments[supplierId];
    if (existing && existing.status === "SUBMITTED" && !quoteParams.allow_update && quoteParams.quotation_ref === (existing.quotation && existing.quotation.quotation_ref)) {
      return { duplicate: true, quotation: existing.quotation };
    }

    const supp = this.getSupplierById(supplierId);
    const suppNum = supplierId.replace("supplier_", "S");
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const quoteRef = quoteParams.quotation_ref || `QT-2026-${suppNum}-${randNum}`;

    // Normalize freight charges canonically (handles lump sum, per MT, per unit, and included)
    const normFreight = this.normalizeFreight(quoteParams, rfq.quantity, rfq.unit);
    const freightAmount = normFreight.freight_amount;
    const freightDisplay = quoteParams.freight_display || normFreight.original_display || normFreight.display;

    // Clear obsolete per-MT fields when lump-sum or included freight is selected
    if (normFreight.freight_type === "lump_sum" || normFreight.freight_type === "included") {
      delete quoteParams.freight_amount_per_mt;
      delete quoteParams.freight_rate_per_mt;
      delete quoteParams.is_per_mt;
    } else if (normFreight.freight_type === "per_mt") {
      quoteParams.freight_amount_per_mt = normFreight.freight_amount_per_mt || normFreight.rate_per_mt;
      quoteParams.is_per_mt = true;
    }

    const baseAmount = quoteParams.base_amount !== undefined ? quoteParams.base_amount : (rfq.quantity * (quoteParams.unit_price_per_mt || 0));
    const gstRate = quoteParams.gst_rate !== undefined ? quoteParams.gst_rate : quoteParams.gst_rate_percent;
    const gstAmount = quoteParams.gst_amount !== undefined ? quoteParams.gst_amount : Math.round(((baseAmount || 0) * (gstRate || 0)) / 100);
    const totalLandedAmount = quoteParams.total_landed_amount !== undefined && quoteParams.total_landed_amount === (baseAmount + gstAmount + freightAmount)
      ? quoteParams.total_landed_amount
      : (baseAmount + gstAmount + freightAmount);

    const quotation = {
      quotation_ref: quoteRef,
      revision: quoteParams.revision || "Rev 0",
      rfq_ref: rfq.rfq_ref,
      supplier_id: supplierId,
      supplier_name: supp ? supp.name : supplierId,
      supplier_location: supp ? supp.location : "India",
      material: rfq.material,
      quantity: rfq.quantity,
      unit: rfq.unit,
      unit_rate_val: quoteParams.unit_rate_val !== undefined ? quoteParams.unit_rate_val : quoteParams.unit_price_per_mt,
      unit_rate_unit: quoteParams.unit_rate_unit || "MT",
      unit_rate_display: quoteParams.unit_rate_display || quoteParams.unit_price_display,
      unit_price: quoteParams.unit_price || quoteParams.unit_price_per_mt || quoteParams.unit_rate_val,
      unit_price_display: quoteParams.unit_price_display || quoteParams.unit_rate_display,
      base_amount: baseAmount,
      calc_breakdown: quoteParams.calc_breakdown || quoteParams.calc_str || "",
      gst_rate: gstRate,
      gst_amount: gstAmount,
      freight_amount: freightAmount,
      freight_display: freightDisplay,
      freight_type: normFreight.freight_type,
      rate_per_mt: normFreight.rate_per_mt,
      rate_per_kg: normFreight.rate_per_kg,
      is_per_mt: (normFreight.freight_type === "per_mt"),
      is_per_kg: (normFreight.freight_type === "per_kg"),
      total_landed_amount: totalLandedAmount,
      delivery_period: quoteParams.delivery_period || quoteParams.delivery_timeline,
      delivery_timeline: quoteParams.delivery_timeline || quoteParams.delivery_period,
      payment_terms: quoteParams.payment_terms || "Not specified",
      quotation_validity: quoteParams.quotation_validity,
      quality_docs: quoteParams.quality_docs || quoteParams.remarks || "Not specified",
      rakshak_status: quoteParams.rakshak_status || null,
      remarks: quoteParams.remarks || quoteParams.quality_docs || "",
      submitted_at: new Date().toISOString(),
      status: "SUBMITTED"
    };

    if (normFreight.freight_type === "per_mt") {
      quotation.freight_amount_per_mt = normFreight.freight_amount_per_mt || normFreight.rate_per_mt;
      quotation.is_per_mt = true;
    } else {
      delete quotation.freight_amount_per_mt;
      delete quotation.freight_rate_per_mt;
      quotation.is_per_mt = false;
    }

    // Update assignment in shared store
    this.shared_store.supplier_assignments[supplierId] = {
      status: "SUBMITTED",
      quotation: quotation,
      submitted_at: new Date().toISOString()
    };

    const qIdx = this.shared_store.quotations.findIndex(x => x.supplier_id === supplierId);
    if (qIdx !== -1) {
      this.shared_store.quotations[qIdx] = quotation;
    } else {
      this.shared_store.quotations.push(quotation);
    }
    this.shared_store.unread_counts[supplierId] = 0;
    this.shared_store.last_snippets[supplierId] = `✅ Submitted: ${quoteRef} (${quotation.revision})`;
    this.shared_store.last_snippets["buyer"] = `📥 Quote from ${supp ? supp.short_name : supplierId}`;

    // Invalidate cached comparison reports to ensure fresh data is always evaluated
    this.shared_store.current_comparison = null;
    this.shared_store.current_comparison_ref = null;
    this.shared_store.comparison_reports = {};

    return { duplicate: false, quotation: quotation };
  },

  getBuyerSummary: function() {
    const rfq = this.shared_store.current_rfq;
    if (!rfq) {
      return {
        has_rfq: false,
        total_invited: 0,
        total_received: 0,
        total_pending: 0,
        suppliers: []
      };
    }

    const invited = rfq.selected_suppliers || [];
    const received = [];
    const pending = [];

    invited.forEach(suppId => {
      const supp = this.getSupplierById(suppId);
      const assign = this.shared_store.supplier_assignments[suppId];
      if (assign && assign.status === "SUBMITTED") {
        received.push({
          id: suppId,
          name: supp ? supp.name : suppId,
          location: supp ? supp.location : "",
          quotation_ref: assign.quotation ? assign.quotation.quotation_ref : "Submitted",
          quotation: assign.quotation,
          status: "SUBMITTED"
        });
      } else {
        pending.push({
          id: suppId,
          name: supp ? supp.name : suppId,
          location: supp ? supp.location : "",
          status: "PENDING"
        });
      }
    });

    return {
      has_rfq: true,
      rfq_ref: rfq.rfq_ref,
      material: rfq.material,
      quantity: rfq.quantity,
      unit: rfq.unit,
      total_invited: invited.length,
      total_received: received.length,
      total_pending: pending.length,
      received_list: received,
      pending_list: pending,
      is_complete: (received.length === invited.length && invited.length > 0)
    };
  },

  calculateComparison: function(rfqRef) {
    return this.generateComparativeStatement(rfqRef);
  },

  generateComparativeStatement: function(rfqRef) {
    const rfq = this.shared_store.current_rfq || this.createRFQ({ material: "Onion", quantity: 50.0 });
    const targetRef = rfqRef || rfq.rfq_ref || `PC-RFQ-${new Date().getFullYear()}-0113`;
    const qty = Number(rfq.quantity) || 50.0;
    const rfqUnit = rfq.unit || "MT";
    const isRfqInMt = rfqUnit.toUpperCase().includes("MT");
    const totalKg = isRfqInMt ? (qty * 1000) : qty;

    const invitedSupplierIds = rfq.selected_suppliers && rfq.selected_suppliers.length > 0
      ? rfq.selected_suppliers
      : ["supplier_1", "supplier_2", "supplier_3"];

    const submittedNames = [];
    const pendingNames = [];
    const rejectedNames = [];

    // DAAM GURU Market Benchmark Lookup
    const daamGuruEngine = (typeof DAAM_GURU_DATA !== "undefined" ? DAAM_GURU_DATA : null) ||
                           (typeof window !== "undefined" && window.DAAM_GURU_DATA ? window.DAAM_GURU_DATA : null) ||
                           (typeof global !== "undefined" && global.DAAM_GURU_DATA ? global.DAAM_GURU_DATA : null) ||
                           (function() { try { return require("./daam_guru_data.js"); } catch (e) { return null; } })();

    const benchmark = daamGuruEngine ? daamGuruEngine.getBenchmarkForRfq(rfq) : null;

    // Analyze each supplier column
    const supplierColumns = invitedSupplierIds.map(suppId => {
      const supp = this.getSupplierById(suppId) || { id: suppId, name: suppId };
      const assign = this.shared_store.supplier_assignments[suppId];
      const isSubmitted = assign && assign.status === "SUBMITTED" && assign.quotation;

      if (!isSubmitted) {
        pendingNames.push(supp.name);
        return {
          supplier_id: suppId,
          supplier_name: supp.name,
          location: supp.location || "",
          status: "PENDING",
          quoted_rate_display: "Quotation pending",
          gst_display: "-",
          freight_display: "-",
          landed_cost_per_unit_display: "-",
          total_landed_cost_display: "-",
          payment_terms: "-",
          delivery_period: "-",
          quality_docs: "-",
          quote_validity: "-",
          past_performance: supp.past_performance || "New",
          rakshak_status: supp.rakshak_status || "GST verification unavailable (Demo)",
          daam_guru_status: "-",
          rank_display: "Pending / No quote",
          rank_code: "PENDING",
          normalized_landed_per_kg: Infinity,
          is_eligible: false,
          quotation: null
        };
      }

      const q = assign.quotation;
      submittedNames.push(supp.name);

      // Unit conversion & landed cost per unit calculation
      const norm = this.normalizeQuotationRates(q, qty, rfqUnit);
      const isQuotedInKg = norm.isQuotedInKg;

      // Base amount
      let baseAmount = q.base_amount;
      if (baseAmount === undefined || baseAmount === null) {
        baseAmount = norm.base_amount;
      }

      // GST rate & amount
      const gstRate = q.gst_rate !== undefined ? q.gst_rate : (q.gst_rate_percent || 0);
      let gstAmount = q.gst_amount;
      if (gstAmount === undefined || gstAmount === null) {
        gstAmount = Math.round((baseAmount * gstRate) / 100);
      }

      // Freight amount & normalization (canonical handling for lump sum, per MT, per unit, and included)
      const normFreight = this.normalizeFreight(q, qty, rfqUnit);
      const freightAmount = normFreight.freight_amount;

      // Total landed cost = Base + GST + Freight (always mathematically consistent)
      const totalLandedCost = baseAmount + gstAmount + freightAmount;

      // Canonical unit normalization for "Landed cost per unit" row
      // When RFQ is in MT or kg, canonical comparison unit is "kg"
      const canonicalUnit = isRfqInMt ? "kg" : (rfqUnit.toLowerCase().includes("kg") ? "kg" : rfqUnit);
      const canonicalQty = isRfqInMt ? (qty * 1000) : qty;
      const landedPerCanonicalUnitVal = canonicalQty > 0 ? (totalLandedCost / canonicalQty) : 0;

      // Normalized landed per kg for sorting
      const normalizedLandedPerKg = landedPerCanonicalUnitVal;

      // Quoted rate display (preserves supplier's original quoted unit, e.g. /MT or /kg)
      let quotedRateDisplay = q.unit_rate_display;
      if (!quotedRateDisplay) {
        const rateVal = q.unit_rate_val || q.unit_price || 0;
        const origUnit = q.unit_rate_unit || (isQuotedInKg ? "kg" : rfqUnit);
        quotedRateDisplay = `INR ${rateVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/${origUnit}`;
      } else if (!quotedRateDisplay.startsWith("INR") && !quotedRateDisplay.startsWith("₹")) {
        quotedRateDisplay = `INR ${quotedRateDisplay}`;
      } else if (quotedRateDisplay.startsWith("₹")) {
        quotedRateDisplay = quotedRateDisplay.replace("₹", "INR ");
      }

      // Format GST display: e.g. "18% (INR 4,950.00)"
      const gstDisplay = `${gstRate}% (INR ${gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;

      // Format Freight display: e.g. "INR 1,000.00", "INR 75,000.00", or "INR 0.00 (Included)"
      let freightDisplay = "";
      if (freightAmount === 0 && (normFreight.freight_type === "included" || (q.freight_display || "").toLowerCase().includes("included"))) {
        freightDisplay = "INR 0.00 (Included)";
      } else {
        freightDisplay = `INR ${freightAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }

      // Format Landed cost display normalized to the RFQ's canonical unit (e.g. INR/kg)
      const landedCostPerUnitDisplay = `INR ${landedPerCanonicalUnitVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/${canonicalUnit}`;
      const totalLandedCostDisplay = `INR ${totalLandedCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

      // GST Verification status & eligibility categories
      const rakshakStatus = q.rakshak_status || supp.rakshak_status || "GST verification unavailable (Demo)";
      const rakshakLower = rakshakStatus.toLowerCase();

      // Confirmed active verification: eligible for recommendation
      const isRakshakVerified = rakshakLower.includes("gst verified") ||
                                rakshakLower.includes("verified and active") ||
                                (rakshakLower.includes("verified") && !rakshakLower.includes("unavailable")) ||
                                rakshakLower === "pass";

      // Failed / Inactive GSTIN: ineligible (disqualified)
      const isRakshakFailed = rakshakLower.includes("failed") ||
                              rakshakLower.includes("blacklisted") ||
                              rakshakLower.includes("inactive");

      // Verification unavailable: pending verification, NOT failed, but not eligible for recommendation
      const isRakshakUnavailable = !isRakshakVerified && !isRakshakFailed;

      // Recommendation eligibility: ONLY verified and active
      const isRecommendationEligible = isRakshakVerified && !isRakshakFailed;

      // Display normalization helpers (strip leading labels for clean T-2 presentation)
      const rawDeliveryPeriod = q.delivery_period || q.delivery_timeline || "2 days";
      const normDeliveryPeriod = typeof rawDeliveryPeriod === "string"
        ? rawDeliveryPeriod.replace(/^delivery\s+period\s+/i, "").trim()
        : rawDeliveryPeriod;

      const rawQuoteValidity = q.quotation_validity || "3 days";
      const normQuoteValidity = typeof rawQuoteValidity === "string"
        ? rawQuoteValidity.replace(/^quotation\s+validity\s+/i, "").trim()
        : rawQuoteValidity;

      // DAAM GURU market benchmark comparison
      let daamGuruStatus = "Benchmark not configured";
      let daamGuruComp = null;
      if (rfq.daam_guru_benchmark && typeof rfq.daam_guru_benchmark === "string") {
        daamGuruStatus = rfq.daam_guru_benchmark;
      } else if (benchmark && daamGuruEngine) {
        daamGuruComp = daamGuruEngine.calculateComparison(normalizedLandedPerKg, benchmark.normalized_price_per_kg);
        if (daamGuruComp) {
          daamGuruStatus = daamGuruComp.t2_table_display;
        }
      } else if (supp.daam_guru_status) {
        daamGuruStatus = supp.daam_guru_status;
      } else {
        daamGuruStatus = "Benchmark unavailable — no matching market record.";
      }

      return {
        supplier_id: suppId,
        supplier_name: supp.name,
        location: supp.location || "",
        status: "SUBMITTED",
        quoted_rate_display: quotedRateDisplay,
        base_amount: baseAmount,
        gst_rate: gstRate,
        gst_amount: gstAmount,
        gst_display: gstDisplay,
        freight_amount: freightAmount,
        freight_display: freightDisplay,
        freight_type: normFreight.freight_type,
        rate_per_mt: normFreight.rate_per_mt,
        landed_cost_per_unit_val: landedPerCanonicalUnitVal,
        landed_cost_per_unit_unit: canonicalUnit,
        landed_cost_per_unit_display: landedCostPerUnitDisplay,
        total_landed_cost: totalLandedCost,
        total_landed_cost_display: totalLandedCostDisplay,
        payment_terms: q.payment_terms || "payment after delivery",
        delivery_period: normDeliveryPeriod,
        quality_docs: q.quality_docs || "No quality documents",
        quote_validity: normQuoteValidity,
        past_performance: supp.past_performance || "Good",
        rakshak_status: rakshakStatus,
        is_rakshak_verified: isRakshakVerified,
        is_rakshak_failed: isRakshakFailed,
        is_rakshak_unavailable: isRakshakUnavailable,
        is_recommendation_eligible: isRecommendationEligible,
        daam_guru_status: daamGuruStatus,
        daam_guru_comparison: daamGuruComp,
        normalized_landed_per_kg: normalizedLandedPerKg,
        quotation: q
      };
    });

    // Rank ALL submitted suppliers by landed cost (L1 / L2 / L3)
    // Preserves landed-cost ranking separately from recommendation eligibility
    const submittedCols = supplierColumns
      .filter(s => s.status === "SUBMITTED")
      .sort((a, b) => a.normalized_landed_per_kg - b.normalized_landed_per_kg);

    submittedCols.forEach((col, idx) => {
      if (idx === 0) {
        col.rank_display = "L1 (Lowest landed cost)";
        col.rank_code = "L1";
      } else {
        col.rank_display = `L${idx + 1}`;
        col.rank_code = `L${idx + 1}`;
      }
    });

    // Decision Section:
    // Recommend lowest landed-cost supplier among suppliers with confirmed eligible RAKSHAK verification
    const eligibleForRec = submittedCols.filter(s => s.is_recommendation_eligible);
    const lowestSubmitted = submittedCols.length > 0 ? submittedCols[0] : null;
    const recommendedCol = eligibleForRec.length > 0 ? eligibleForRec[0] : null;

    let recommendedSupplier = "";
    let reason = "";

    if (recommendedCol) {
      recommendedSupplier = recommendedCol.supplier_name;

      if (lowestSubmitted && lowestSubmitted.supplier_id !== recommendedCol.supplier_id) {
        // A lower-priced bidder exists who could not be recommended
        if (lowestSubmitted.is_rakshak_failed) {
          reason = `L1 bidder (${lowestSubmitted.supplier_name}) cannot be recommended due to failed GST verification (${lowestSubmitted.rakshak_status}). Recommended ${recommendedCol.supplier_name} as the lowest GST-verified bidder.`;
        } else {
          reason = `Lowest quoted bidder (${lowestSubmitted.supplier_name}) cannot be recommended as GST verification is pending/unavailable. Recommended ${recommendedCol.supplier_name} as the lowest GST-verified bidder.`;
        }
      } else {
        // Lowest quoted bidder is verified and active
        reason = `L1 lowest landed cost with acceptable delivery timeline (${recommendedCol.delivery_period}), and competitive overall basket value.`;
      }
    } else {
      // No supplier is verified and eligible
      recommendedSupplier = "No recommendation — verification pending or failed";

      if (submittedCols.length === 0) {
        reason = "No quotations submitted yet to evaluate.";
      } else if (submittedCols.some(s => s.is_rakshak_unavailable) && !submittedCols.some(s => s.is_rakshak_failed)) {
        reason = "All submitted quotations have pending or unavailable GST verification. Recommendation deferred until verification is completed.";
      } else if (submittedCols.every(s => s.is_rakshak_failed)) {
        reason = "All submitted quotations failed statutory GST verification criteria.";
      } else {
        reason = "No submitted quotation currently holds confirmed GST-verified status.";
      }
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const formattedDate = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    // Comparison Ref: PC-BCR-{YYYY}-{####} matching RFQ sequence
    const rfqSuffix = targetRef.replace(/^PC-RFQ-\d{4}-/, '').replace(/^RFQ-\d{4}-/, '').replace(/^PC-RFQ-/, '');
    const comparisonRef = `PC-BCR-${currentYear}-${rfqSuffix || '0113'}`;

    // Quotes received summary string:
    // e.g. "2 received - 2 considered - 0 rejected (1 awaiting response: Test Supplier Pvt Ltd)"
    let quotesConsideredStr = `${submittedNames.length} received - ${submittedNames.length} considered - ${rejectedNames.length} rejected`;
    if (pendingNames.length > 0) {
      quotesConsideredStr += ` (${pendingNames.length} awaiting response: ${pendingNames.join(", ")})`;
    }

    // Revision preservation
    const prevReport = this.shared_store.comparison_reports[targetRef];
    let revision = "Rev 0";
    if (prevReport && prevReport.revision) {
      const prevRevNum = parseInt(prevReport.revision.replace("Rev ", ""), 10) || 0;
      revision = `Rev ${prevRevNum + 1}`;
    }

    // Format item & quantity string: e.g. "Onion, 50.000 MT"
    const itemQtyStr = `${rfq.material || "Onion"}, ${(Number(qty)).toFixed(3)} ${rfqUnit}`;

    const report = {
      comparison_ref: comparisonRef,
      revision: revision,
      rfq_ref: targetRef,
      rfq_date: rfq.date_display || (rfq.created_at ? new Date(rfq.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : formattedDate),
      material: rfq.material || "Onion",
      quantity: qty,
      unit: rfqUnit,
      item_and_quantity: itemQtyStr,
      prepared_on: formattedDate,
      quotes_summary_line: quotesConsideredStr,
      quotes_received_count: submittedNames.length,
      quotes_considered_count: submittedNames.length,
      quotes_rejected_count: rejectedNames.length,
      pending_count: pendingNames.length,
      columns: supplierColumns,
      daam_guru_benchmark: benchmark,
      daam_guru_disclosure: "Market price benchmark uses illustrative demo data for simulation purposes only. It is not a live or verified market quotation.",
      decision: {
        recommended_supplier: recommendedSupplier,
        reason: reason,
        negotiation_attempted: "No - direct evaluation (commercial assist available if required)",
        approved_quantity_split: "Pending buyer approval",
        prepared_by: `Procurement Desk . ${formattedDate}`,
        approved_by: "Pending buyer approval"
      },
      note: "Golden rule for MSMEs: compare LANDED COST (rate + GST impact + freight), never the bare quoted rate - the cheapest quote is often not the cheapest supplier. The GST verification row is pass/fail: a supplier failing verification cannot be recommended regardless of price. The Market Price Benchmark row shows whether even the L1 price is above market."
    };

    // Store in shared_store
    this.shared_store.comparison_reports[targetRef] = report;
    this.shared_store.current_comparison = report;
    this.shared_store.current_comparison_ref = comparisonRef;

    return report;
  },

  numberToWordsIndian: function(num) {
    if (num === null || num === undefined || isNaN(num)) return "Zero";
    const n = Math.round(Number(num));
    if (n === 0) return "Zero";

    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
               'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function convertTwoDigits(val) {
      if (val < 20) return a[val];
      const tens = Math.floor(val / 10);
      const units = val % 10;
      return b[tens] + (units ? "-" + a[units] : "");
    }

    function convertThreeDigits(val) {
      const hundred = Math.floor(val / 100);
      const rest = val % 100;
      let res = "";
      if (hundred > 0) {
        res += a[hundred] + " Hundred";
        if (rest > 0) res += " ";
      }
      if (rest > 0) {
        res += convertTwoDigits(rest);
      }
      return res;
    }

    let crore = Math.floor(n / 10000000);
    let remainder = n % 10000000;
    let lakh = Math.floor(remainder / 100000);
    remainder = remainder % 100000;
    let thousand = Math.floor(remainder / 1000);
    remainder = remainder % 1000;
    let hundred = remainder;

    const parts = [];
    if (crore > 0) {
      parts.push(convertThreeDigits(crore) + " Crore");
    }
    if (lakh > 0) {
      parts.push(convertTwoDigits(lakh) + " Lakh");
    }
    if (thousand > 0) {
      parts.push(convertTwoDigits(thousand) + " Thousand");
    }
    if (hundred > 0) {
      parts.push(convertThreeDigits(hundred));
    }

    return parts.join(" ").trim();
  },

  normalizeFreight: function(quoteData, rfqQuantity = 50.0, rfqUnit = "MT") {
    const q = quoteData || {};
    const qty = Number(rfqQuantity || 50.0);
    const isRfqInMt = String(rfqUnit || "MT").toUpperCase().includes("MT");
    const qtyInMt = isRfqInMt ? qty : (qty / 1000.0);
    const qtyInKg = isRfqInMt ? (qty * 1000.0) : qty;

    const rawDisp = String(q.freight_display || q.freight_desc || q.freight || "").trim();
    const rawType = String(q.freight_type || "").trim().toLowerCase();

    // ─────────────────────────────────────────────────────────────
    // 1. EXPLICIT freight_type TAKES ABSOLUTE PRECEDENCE
    // ─────────────────────────────────────────────────────────────

    // Explicit 1: Included
    if (rawType === "included" || rawType === "free" || rawType === "nil") {
      return {
        freight_type: "included",
        freight_amount: 0,
        rate_per_mt: 0,
        rate_per_kg: 0,
        display: "INR 0.00 (Included)",
        original_display: q.freight_display || "₹0 (Freight included in rate)"
      };
    }

    // Explicit 2: Lump Sum (NEVER multiply by quantity)
    if (rawType === "lump_sum" || rawType === "flat") {
      let amount = 0;
      if (q.freight_amount !== undefined && q.freight_amount !== null) {
        amount = Math.round(Number(q.freight_amount));
      } else {
        const match = rawDisp.replace(/[₹,Rs\.]/gi, " ").match(/(\d+(?:\s\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)/);
        amount = match ? Math.round(parseFloat(match[1].replace(/\s/g, ""))) : 0;
      }
      const ratePerMt = qtyInMt > 0 ? (amount / qtyInMt) : 0;
      const ratePerKg = qtyInKg > 0 ? (amount / qtyInKg) : 0;
      const formattedDisplay = `INR ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      return {
        freight_type: "lump_sum",
        freight_amount: amount,
        rate_per_mt: ratePerMt,
        rate_per_kg: ratePerKg,
        display: formattedDisplay,
        original_display: q.freight_display || `₹${amount.toLocaleString('en-IN')} (Lump sum)`
      };
    }

    // Explicit 3: Per-MT (Multiply rate by RFQ quantity in MT)
    if (rawType === "per_mt") {
      let ratePerMt = 0;
      if (q.freight_amount_per_mt !== undefined && q.freight_amount_per_mt !== null && Number(q.freight_amount_per_mt) > 0) {
        ratePerMt = Number(q.freight_amount_per_mt);
      } else if (q.freight_rate_per_mt !== undefined && q.freight_rate_per_mt !== null && Number(q.freight_rate_per_mt) > 0) {
        ratePerMt = Number(q.freight_rate_per_mt);
      } else if (q.rate_per_mt !== undefined && q.rate_per_mt !== null && Number(q.rate_per_mt) > 0 && (!q.freight_amount || Number(q.rate_per_mt) !== Number(q.freight_amount))) {
        ratePerMt = Number(q.rate_per_mt);
      } else {
        const perMtMatch = rawDisp.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:per\s*mt|per\s*tonne|\/\s*mt|\/\s*tonne)/i);
        if (perMtMatch) {
          ratePerMt = parseFloat(perMtMatch[1].replace(/,/g, ""));
        } else {
          const match = rawDisp.replace(/[₹,Rs\.]/gi, " ").match(/(\d+(?:\s\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)/);
          if (match) {
            ratePerMt = parseFloat(match[1].replace(/\s/g, ""));
          } else if (q.freight_amount !== undefined && q.freight_amount !== null) {
            ratePerMt = (Number(q.freight_amount) > 10000 && qtyInMt > 0) ? (Number(q.freight_amount) / qtyInMt) : Number(q.freight_amount);
          }
        }
      }
      let totalFreight = 0;
      if (q.freight_amount !== undefined && q.freight_amount !== null && Number(q.freight_amount) === Math.round(ratePerMt * qtyInMt)) {
        totalFreight = Number(q.freight_amount);
      } else {
        totalFreight = Math.round(ratePerMt * qtyInMt);
      }
      const ratePerKg = ratePerMt / 1000.0;
      const formattedDisplay = `INR ${totalFreight.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      return {
        freight_type: "per_mt",
        freight_amount: totalFreight,
        freight_amount_per_mt: ratePerMt,
        rate_per_mt: ratePerMt,
        rate_per_kg: ratePerKg,
        display: formattedDisplay,
        original_display: q.freight_display || `₹${totalFreight.toLocaleString('en-IN')} (₹${ratePerMt.toLocaleString('en-IN')}/MT × ${qtyInMt} MT)`
      };
    }

    // ─────────────────────────────────────────────────────────────
    // 2. FALLBACK INFERENCE (When freight_type is not explicitly set)
    // ─────────────────────────────────────────────────────────────
    if (
      q.freight_amount === 0 ||
      /\b(included|nil|free|exempt|₹0|rs\.?\s*0)\b/i.test(rawDisp)
    ) {
      return {
        freight_type: "included",
        freight_amount: 0,
        rate_per_mt: 0,
        rate_per_kg: 0,
        display: "INR 0.00 (Included)",
        original_display: q.freight_display || "₹0 (Freight included in rate)"
      };
    }

    const isPerMt = (
      q.is_per_mt === true ||
      (q.freight_amount_per_mt !== undefined && q.freight_amount_per_mt !== null && q.freight_amount_per_mt > 0) ||
      /\b(per\s*mt|per\s*tonne|\/\s*mt|\/\s*tonne)\b/i.test(rawDisp)
    );

    if (isPerMt) {
      let rate = 0;
      if (q.freight_amount_per_mt !== undefined && q.freight_amount_per_mt !== null && q.freight_amount_per_mt > 0) {
        rate = Number(q.freight_amount_per_mt);
      } else if (q.freight_rate_per_mt !== undefined && q.freight_rate_per_mt !== null && q.freight_rate_per_mt > 0) {
        rate = Number(q.freight_rate_per_mt);
      } else {
        const perMtMatch = rawDisp.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:per\s*mt|per\s*tonne|\/\s*mt|\/\s*tonne)/i);
        if (perMtMatch) {
          rate = parseFloat(perMtMatch[1].replace(/,/g, ""));
        } else {
          const match = rawDisp.replace(/[₹,Rs\.]/gi, " ").match(/(\d+(?:\s\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)/);
          rate = match ? parseFloat(match[1].replace(/\s/g, "")) : 0;
        }
      }
      let totalFreight = 0;
      if (q.freight_amount !== undefined && q.freight_amount !== null && Number(q.freight_amount) === Math.round(rate * qtyInMt)) {
        totalFreight = Number(q.freight_amount);
      } else if (q.freight_amount !== undefined && q.freight_amount !== null && Number(q.freight_amount) > 10000 && !q.freight_amount_per_mt && rate > 10000) {
        totalFreight = Number(q.freight_amount);
        rate = qtyInMt > 0 ? (totalFreight / qtyInMt) : 0;
      } else {
        totalFreight = Math.round(rate * qtyInMt);
      }
      const ratePerKg = rate / 1000.0;
      const formattedDisplay = `INR ${totalFreight.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      return {
        freight_type: "per_mt",
        freight_amount: totalFreight,
        freight_amount_per_mt: rate,
        rate_per_mt: rate,
        rate_per_kg: ratePerKg,
        display: formattedDisplay,
        original_display: q.freight_display || `₹${totalFreight.toLocaleString('en-IN')} (₹${rate.toLocaleString('en-IN')}/MT × ${qtyInMt} MT)`
      };
    }

    // Default Lump Sum fallback
    let totalFreight = 0;
    if (q.freight_amount !== undefined && q.freight_amount !== null) {
      totalFreight = Math.round(Number(q.freight_amount));
    } else {
      const match = rawDisp.replace(/[₹,Rs\.]/gi, " ").match(/(\d+(?:\s\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)/);
      totalFreight = match ? Math.round(parseFloat(match[1].replace(/\s/g, ""))) : 0;
    }
    const ratePerMt = qtyInMt > 0 ? (totalFreight / qtyInMt) : 0;
    const ratePerKg = qtyInKg > 0 ? (totalFreight / qtyInKg) : 0;
    const formattedDisplay = `INR ${totalFreight.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return {
      freight_type: "lump_sum",
      freight_amount: totalFreight,
      rate_per_mt: ratePerMt,
      rate_per_kg: ratePerKg,
      display: formattedDisplay,
      original_display: q.freight_display || formattedDisplay
    };
  },

  normalizeQuotationRates: function(quoteData, rfqQuantity = 50.0, rfqUnit = "MT") {
    const q = quoteData || {};
    const isRfqInMt = String(rfqUnit || "MT").toUpperCase().includes("MT");

    // 1. Detect original quoted unit
    let rawUnit = q.unit_rate_unit || q.quoted_unit || q.unit;
    let isQuotedInKg = false;
    let isQuotedInMt = false;

    if (rawUnit) {
      const u = String(rawUnit).trim().toLowerCase();
      if (u === "kg" || u === "kilogram" || u === "kilograms") isQuotedInKg = true;
      if (u === "mt" || u === "tonne" || u === "tonnes" || u === "ton") isQuotedInMt = true;
    }

    if (!isQuotedInKg && !isQuotedInMt) {
      // Inspect display string ONLY before any parentheses to avoid false positives from parenthetical conversions
      const disp = String(q.unit_rate_display || q.unit_price_display || q.quoted_rate_display || "");
      const primaryPart = disp.split("(")[0];
      if (/\/\s*kg|per\s*kg|\bkg\b/i.test(primaryPart)) {
        isQuotedInKg = true;
      } else if (/\/\s*(mt|tonne|ton)|per\s*(mt|tonne|ton)|\b(mt|tonne|ton)\b/i.test(primaryPart)) {
        isQuotedInMt = true;
      }
    }

    const rawRate = Number(q.unit_rate_val !== undefined ? q.unit_rate_val : (q.unit_price !== undefined ? q.unit_price : (q.unit_rate || 0)));

    if (!isQuotedInKg && !isQuotedInMt) {
      // Natural inference: rate <= 500 is per kg for onion; > 500 is per MT
      if (rawRate > 0 && rawRate <= 500) {
        isQuotedInKg = true;
      } else {
        isQuotedInMt = true;
      }
    }

    let ratePerKg = 0;
    let ratePerMt = 0;

    if (isQuotedInKg) {
      ratePerKg = rawRate;
      ratePerMt = rawRate * 1000;
    } else {
      ratePerMt = rawRate;
      ratePerKg = rawRate / 1000;
    }

    const ratePerRfqUnit = isRfqInMt ? ratePerMt : ratePerKg;
    const qty = Number(rfqQuantity || 50.0);
    const baseAmount = (q.base_amount !== undefined && q.base_amount !== null)
      ? Number(q.base_amount)
      : Math.round(isRfqInMt ? (qty * ratePerMt) : (qty * ratePerKg));

    return {
      isQuotedInKg: isQuotedInKg,
      original_quoted_unit: isQuotedInKg ? "kg" : "MT",
      original_quoted_rate: rawRate,
      rate_per_kg: ratePerKg,
      rate_per_mt: ratePerMt,
      rate_per_rfq_unit: ratePerRfqUnit,
      base_amount: baseAmount
    };
  },

  buildPoObject: function(selectedQuote) {
    const rfq = this.shared_store.current_rfq;
    const currentYear = new Date().getFullYear();
    const suffix = rfq ? rfq.rfq_ref.replace(/^PC-RFQ-\d{4}-/, '').replace(/^RFQ-\d{4}-/, '') : '0113';
    const poRef = selectedQuote.po_ref || `PC-PO-${currentYear}-${suffix}`;
    const qty = selectedQuote.quantity !== undefined ? selectedQuote.quantity : (rfq ? rfq.quantity : 50.0);
    const rfqUnit = rfq ? (rfq.unit || "MT") : "MT";

    // Normalize rate and unit cleanly exactly once
    const norm = this.normalizeQuotationRates(selectedQuote, qty, rfqUnit);

    const baseTotal = (selectedQuote.base_amount !== undefined && selectedQuote.base_amount !== null)
      ? selectedQuote.base_amount
      : norm.base_amount;

    const freightTotal = selectedQuote.freight_amount !== undefined ? selectedQuote.freight_amount : 0;
    const taxableSubtotal = baseTotal + freightTotal;
    const gstRate = selectedQuote.gst_rate !== undefined ? selectedQuote.gst_rate : 0;
    const gstAmount = selectedQuote.gst_amount !== undefined ? selectedQuote.gst_amount : Math.round((baseTotal * gstRate) / 100.0);
    const totalOrderValue = selectedQuote.total_landed_amount !== undefined ? selectedQuote.total_landed_amount : (baseTotal + gstAmount + freightTotal);

    const supp = this.getSupplierById(selectedQuote.supplier_id) || {};
    const vendorName = selectedQuote.supplier_name || supp.name || "Not specified";
    const vendorAddress = selectedQuote.supplier_address || supp.address || "Not specified";
    const vendorLocation = selectedQuote.supplier_location || supp.location || "Not specified";
    const vendorGstin = selectedQuote.supplier_gstin || supp.gstin || supp.gst_number || "Not specified";
    const vendorContactName = selectedQuote.supplier_contact || supp.contact_name || "Not specified";
    const vendorContactPhone = selectedQuote.supplier_phone || supp.contact_phone || "Not specified";
    let vendorState = selectedQuote.supplier_state || supp.state || "Not specified";
    if (vendorState === "Not specified" && vendorLocation !== "Not specified" && vendorLocation.includes(",")) {
      vendorState = vendorLocation.split(",")[1].trim();
    }

    const rfqLoc = (rfq && (rfq.delivery_location || (rfq.terms_config && rfq.terms_config.term_2)))
      ? (rfq.delivery_location || rfq.terms_config.term_2)
      : (this.buyer.delivery_address || "Not specified");
    const delAddress = (selectedQuote.delivery_address && selectedQuote.delivery_address !== "Not specified") ? selectedQuote.delivery_address : rfqLoc;
    let delPin = "Not specified";
    const pinMatch = delAddress.match(/\b[1-9][0-9]{5}\b/);
    if (pinMatch) delPin = pinMatch[0];

    const delContact = this.buyer.contact_name || "Procurement Desk";
    const delMobile = this.buyer.contact_phone || "+91 90000 00000 (Demo placeholder)";

    const compRef = this.shared_store.current_comparison_ref || (this.shared_store.current_comparison ? this.shared_store.current_comparison.comparison_ref : `PC-BCR-${currentYear}-${suffix}`);
    const rfqRef = rfq ? rfq.rfq_ref : `PC-RFQ-${currentYear}-${suffix}`;
    const quoteRef = selectedQuote.quotation_ref || "Not specified";
    const quoteDate = selectedQuote.quotation_date || (selectedQuote.submitted_at ? new Date(selectedQuote.submitted_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "Not specified");

    const deliveryTimeline = selectedQuote.delivery_timeline || selectedQuote.delivery_period || (rfq ? rfq.delivery_required_by : "Not specified") || "Not specified";
    const paymentTerms = selectedQuote.payment_terms || (rfq ? (rfq.terms_config && rfq.terms_config.term_3) : "Not specified") || "Not specified";
    const transportResponsibility = selectedQuote.transport_responsibility || "Supplier scope (FOR Destination)";
    const qualityDocs = selectedQuote.quality_docs || (rfq ? (rfq.terms_config && rfq.terms_config.term_5) : "Not specified") || "Not specified";
    const amountInWords = `Indian Rupees ${this.numberToWordsIndian(totalOrderValue)} Only`;

    const poDateFormatted = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    // Rate for the PO line item in RFQ unit (MT or kg)
    const poLineRate = norm.rate_per_rfq_unit;
    const poLineRateDisplay = `INR ${poLineRate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/${rfqUnit}`;

    const baseSpecs = rfq ? (rfq.technical_specs || (rfq.detailed_specs ? `${rfq.detailed_specs.variety || ''}, ${rfq.detailed_specs.size || ''}, ${rfq.detailed_specs.quality || ''}` : "Standard Grade A")) : "Grade A (45-60mm), Moisture < 14%";
    const finalSpecs = `${baseSpecs} • Quoted at ₹${norm.rate_per_kg.toLocaleString('en-IN', { maximumFractionDigits: 2 })}/kg`;

    const lineItem = {
      s_no: 1,
      item_name: rfq ? (rfq.material || "Onion") : "Onion",
      specs: finalSpecs,
      specification: finalSpecs,
      hsn: (rfq && rfq.hsn) ? rfq.hsn : "0703",
      quantity: qty,
      unit: rfqUnit,
      unit_rate: poLineRate,
      unit_rate_display: poLineRateDisplay,
      base_total: baseTotal,
      freight_rate: freightTotal,
      freight_total: freightTotal,
      taxable_value: taxableSubtotal,
      gst_rate: gstRate,
      gst_amount: gstAmount,
      total_landed: totalOrderValue
    };

    const po = {
      po_ref: poRef,
      po_date: poDateFormatted,
      date_display: new Date().toLocaleDateString('en-GB'),
      created_at: new Date().toISOString(),
      rfq_ref: rfqRef,
      comparison_ref: compRef,
      quotation_ref: quoteRef,
      quotation_date: quoteDate,
      buyer_signatory_name: null,
      buyer_signed_at: null,
      buyer_signed_date: null,
      buyer_approval_status: "PENDING",
      supplier_signatory_name: null,
      supplier_response_status: "PENDING",
      supplier_response_at: null,
      supplier_response_date: null,
      overall_status: "DRAFT",
      document_version: "draft",
      document_versions: {},
      buyer: {
        name: this.buyer.name || "Apex Green Metals Pvt Ltd",
        address: this.buyer.registered_address || this.buyer.address || "Not specified",
        gstin: this.buyer.gstin || "Not specified",
        state: this.buyer.state || "Not specified",
        contact_name: this.buyer.contact_name || "Procurement Desk",
        contact_phone: this.buyer.contact_phone || "+91 90000 00000 (Demo placeholder)",
        contact_email: this.buyer.contact_email || "procurement@example.com"
      },
      vendor: {
        id: selectedQuote.supplier_id,
        name: vendorName,
        address: vendorAddress,
        location: vendorLocation,
        gstin: vendorGstin,
        state: vendorState,
        contact_name: vendorContactName,
        contact_phone: vendorContactPhone
      },
      deliver_to: {
        address: delAddress,
        pin: delPin,
        receiving_contact: delContact,
        receiving_mobile: delMobile
      },
      line_items: [lineItem],
      base_total: baseTotal,
      taxable_subtotal: taxableSubtotal,
      gst_rate: selectedQuote.gst_rate || 0,
      gst_amount: gstAmount,
      freight_total: freightTotal,
      total_order_value_inr: totalOrderValue,
      amount_in_words: amountInWords,
      delivery_address: delAddress,
      delivery_timeline: deliveryTimeline,
      payment_terms: paymentTerms,
      transport_responsibility: transportResponsibility,
      quality_docs: qualityDocs,
      compliance_warning: selectedQuote.compliance_warning || null,
      status: "ISSUED",
      milestones: [
        { key: "ISSUED", label: "PO Generated & Digitally Dispatched", status: "COMPLETED", date: new Date().toLocaleDateString('en-GB') },
        { key: "ACKNOWLEDGED", label: "Supplier Commercial Acceptance", status: "PENDING", date: null },
        { key: "IN_TRANSIT", label: "Consignment Dispatched & E-Way Bill Generated", status: "PENDING", date: null },
        { key: "DELIVERED", label: "Weighbridge Inward & QC at Hazira Works", status: "PENDING", date: null }
      ]
    };

    po.document_html = this.generatePoDocumentHtml(po);
    po.document_versions.draft = po.document_html;
    return po;
  },

  createPurchaseOrder: function(selectedQuote) {
    const po = this.buildPoObject(selectedQuote);
    this.shared_store.current_po = po;
    this.shared_store.current_po_document = po.document_html;
    this.shared_store.selected_quotation = selectedQuote;
    this.shared_store.purchase_orders.push(po);
    return po;
  },

  generatePoDocumentHtml: function(poData) {
    const po = poData || this.shared_store.current_po;
    if (!po) return "<p>No Purchase Order data available.</p>";

    const b = po.buyer || {};
    const v = po.vendor || {};
    const d = po.deliver_to || {};
    const items = po.line_items || [];
    const item1 = items[0] || {};

    const baseFormatted = po.base_total ? po.base_total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00";
    const gstFormatted = po.gst_amount ? po.gst_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00";
    const freightFormatted = po.freight_total ? po.freight_total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00";
    const totalFormatted = po.total_order_value_inr ? po.total_order_value_inr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00";

    // Format strings matching Draft_PO_PO-2026-0007.pdf
    const quoteRefAndDate = po.quotation_ref && po.quotation_ref !== "Not specified"
      ? `${po.quotation_ref} (dated ${po.quotation_date || 'Not specified'})`
      : `dated ${po.quotation_date || 'Not specified'}`;
    const refStr = `RFQ No. ${po.rfq_ref || 'PC-RFQ-2026-0113'} - Supplier quotation ${quoteRefAndDate} - Bid comparison ref. ${po.comparison_ref || 'PC-BCR-2026-0113'}`;

    // Buyer string
    const buyerAddress = (b.address && b.address !== "Not specified") ? b.address : "Not specified";
    const buyerGstin = (b.gstin && b.gstin !== "Not specified") ? b.gstin : "Not specified";
    const buyerState = (b.state && b.state !== "Not specified") ? b.state : "Not specified";
    const buyerContact = b.contact_name ? `${b.contact_name}${b.contact_phone ? ' (' + b.contact_phone + ')' : ''}` : (b.contact_phone || 'Not specified');
    const buyerStr = `${b.name || 'Apex Green Metals Pvt Ltd'} - ${buyerAddress} - GSTIN: ${buyerGstin} - State: ${buyerState} - Contact: ${buyerContact}`;

    // Supplier (Vendor) string
    const vendorAddress = (v.address && v.address !== "Not specified") ? v.address : "Not specified";
    const vendorGstin = (v.gstin && v.gstin !== "Not specified") ? v.gstin : "Not specified";
    const vendorState = (v.state && v.state !== "Not specified") ? v.state : "Not specified";
    const vendorContact = v.contact_name ? `${v.contact_name}${v.contact_phone ? ' (' + v.contact_phone + ')' : ''}` : (v.contact_phone || 'Not specified');
    const vendorStr = `${v.name || 'Not specified'} - ${vendorAddress} - GSTIN: ${vendorGstin} - State: ${vendorState} - Contact: ${vendorContact}`;

    // Deliver to string
    const deliverAddress = (d.address && d.address !== "Not specified") ? d.address : "Not specified";
    const deliverPin = (d.pin && d.pin !== "Not specified") ? d.pin : "Not specified";
    const deliverContact = d.receiving_contact ? `${d.receiving_contact}${d.receiving_mobile ? ' (' + d.receiving_mobile + ')' : ''}` : (d.receiving_mobile || 'Not specified');
    const deliverToStr = `${deliverAddress} - Pin: ${deliverPin} - Receiving contact: ${deliverContact}`;

    // Part B special conditions
    let specialRow1Desc = `Agreed delivery lead time: ${po.delivery_timeline || '2 days from PO issuance'}. Delivery destination: ${deliverAddress}`;
    let specialRow1Override = "None";
    if (po.compliance_warning) {
      specialRow1Desc = `Statutory Verification Standing: Vendor statutory GST verification standing: ${po.compliance_warning}. Purchase order issued under buyer commercial authority.`;
      specialRow1Override = "Condition 9";
    }

    let specialRow2Desc = "&nbsp;";
    let specialRow2Override = "&nbsp;";
    if (po.quality_docs && po.quality_docs !== "Not specified") {
      specialRow2Desc = `Quality acceptance conditional on ${po.quality_docs} and inspection upon receipt.`;
      specialRow2Override = "Condition 4";
    }

    const jurisdictionLocation = buyerState !== "Not specified" ? buyerState : (buyerAddress.includes("Assam") ? "Assam" : "Not specified");

    const amountInWordsText = po.amount_in_words
      ? po.amount_in_words
      : `Indian Rupees ${this.numberToWordsIndian(po.total_order_value_inr)} Only`;

    return `
      <div class="t3-po-document">
        
        <!-- ==================== PAGE 1 OF 2 ==================== -->
        <div class="t3-page t3-page-1">
          <!-- Header -->
          <div class="t3-tag">TEMPLATE T-3</div>
          <div class="t3-title">Work Order / Purchase Order (WO/PO)</div>
          <div class="t3-header-divider"></div>

          <!-- Summary Table -->
          <table class="t3-summary-table">
            <tbody>
              <tr>
                <td class="t3-summary-label">PO No. / Date</td>
                <td class="t3-summary-val">${po.po_ref || 'PO-2026-0007'} - Date: ${po.po_date || po.date_display}</td>
              </tr>
              <tr>
                <td class="t3-summary-label">Ref.</td>
                <td class="t3-summary-val">${refStr}</td>
              </tr>
              <tr>
                <td class="t3-summary-label">Buyer</td>
                <td class="t3-summary-val">${buyerStr}</td>
              </tr>
              <tr>
                <td class="t3-summary-label">Supplier (Vendor)</td>
                <td class="t3-summary-val">${vendorStr}</td>
              </tr>
              <tr>
                <td class="t3-summary-label">Deliver to</td>
                <td class="t3-summary-val">${deliverToStr}</td>
              </tr>
            </tbody>
          </table>

          <!-- Order Details Section -->
          <div class="t3-section-heading">Order details</div>
          <table class="t3-order-table">
            <thead>
              <tr>
                <th style="width: 26pt; text-align: center;">S.No</th>
                <th style="width: 194pt; text-align: left;">Item description &amp; specification</th>
                <th style="width: 45pt; text-align: center;">HSN</th>
                <th style="width: 45pt; text-align: right;">Qty</th>
                <th style="width: 40pt; text-align: center;">Unit</th>
                <th style="width: 55pt; text-align: right;">Rate (INR)</th>
                <th style="width: 40pt; text-align: right;">GST %</th>
                <th style="width: 70pt; text-align: right;">Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align: center;">1</td>
                <td style="text-align: left;">
                  <strong>${item1.item_name || 'Material'}</strong>
                  ${(item1.specs || item1.specification) ? '<br><span style="color: #444444; font-size: 6.2pt;">' + (item1.specs || item1.specification) + '</span>' : ''}
                </td>
                <td style="text-align: center;">${item1.hsn || '-'}</td>
                <td style="text-align: right;">${item1.quantity ? Number(item1.quantity).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '1.00'}</td>
                <td style="text-align: center;">${item1.unit || 'MT'}</td>
                <td style="text-align: right;">${item1.unit_rate ? Number(item1.unit_rate).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}</td>
                <td style="text-align: right;">${item1.gst_rate || 18}%</td>
                <td style="text-align: right;">${baseFormatted}</td>
              </tr>
              <tr class="t3-total-row">
                <td colspan="7" class="t3-total-label">Sub-total</td>
                <td class="t3-total-val">${baseFormatted}</td>
              </tr>
              <tr class="t3-total-row">
                <td colspan="7" class="t3-total-label">GST</td>
                <td class="t3-total-val">${gstFormatted}</td>
              </tr>
              <tr class="t3-total-row">
                <td colspan="7" class="t3-total-label">Freight (if payable)</td>
                <td class="t3-total-val">${freightFormatted}</td>
              </tr>
              <tr class="t3-grand-total-row">
                <td colspan="7" class="t3-grand-total-label">TOTAL<span class="t3-compat-tag" style="display:none;"> PURCHASE ORDER VALUE (INR)</span></td>
                <td class="t3-grand-total-val">${totalFormatted}</td>
              </tr>
            </tbody>
          </table>

          <!-- Commercial Terms & Amount in Words Lines -->
          <div class="t3-commercial-lines">
            <div class="t3-commercial-line">
              <strong>Amount in words<span class="t3-compat-tag" style="display:none;"> (INR)</span>:</strong> ${amountInWordsText}
            </div>
            <div class="t3-commercial-line">
              <strong>Delivery date (time is of the essence):</strong> ${po.delivery_timeline || 'As mutually agreed / Per delivery schedule'}
            </div>
            <div class="t3-commercial-line">
              <strong>Payment terms:</strong> ${po.payment_terms || 'Payment after delivery'}
            </div>
            <div class="t3-commercial-line">
              <strong>Transport / freight responsibility:</strong> ${po.freight_display || 'Supplier (FOR destination) / Buyer (ex-works)'}
            </div>
          </div>

          <!-- Part A Section Heading -->
          <div class="t3-section-heading" style="margin-top: 10pt;">Part A - Minimum Standard Conditions (apply to every WO/PO)</div>
          
          <!-- Conditions 1 to 7 -->
          <div class="t3-condition-p1">
            <strong>1. Acceptance.</strong> Supplier's signed copy, written confirmation, or WhatsApp confirmation of this PO constitutes acceptance of all its conditions. Commencing supply also constitutes acceptance.
          </div>
          <div class="t3-condition-p1">
            <strong>2. Prices firm.</strong> Rates are firm for the full order quantity and duration; no escalation is payable unless agreed in writing as a Special Condition.
          </div>
          <div class="t3-condition-p1">
            <strong>3. Delivery &amp; delay.</strong> Delivery by the date stated is essential. For delay attributable to the supplier, buyer may deduct liquidated damages of 0.5% of the delayed portion's value per week, up to a maximum of 5%, and/or cancel the unexecuted portion.
          </div>
          <div class="t3-condition-p1">
            <strong>4. Quality &amp; rejection.</strong> Goods must conform to the specification, sample (if any), and quality documents promised. Rejected goods will be returned at supplier's risk and cost, including to-and-fro freight; replacement or refund within 15 days.
          </div>
          <div class="t3-condition-p1">
            <strong>5. Invoicing &amp; GST.</strong> A GST-compliant tax invoice quoting this PO number must accompany the goods, along with promised test certificates. Payment of the GST portion is conditional on the invoice appearing in buyer's GSTR-2B; amounts may be withheld if the supplier fails to file.
          </div>
          <div class="t3-condition-p1">
            <strong>6. Risk &amp; title.</strong> Risk in the goods passes to the buyer only on receipt AND acceptance at the delivery location; title passes on payment or acceptance, whichever is earlier.
          </div>
          <div class="t3-condition-p1">
            <strong>7. Compliance &amp; origin data.</strong> Supplier shall comply with all applicable laws (including labour and environmental laws, and prohibition of child labour) and shall, on request, declare the origin of materials and provide data reasonably required for buyer's export compliance (e.g., CBAM emissions data, EUDR origin/geo-location, product composition for Digital Product Passports) at no extra charge.
          </div>
        </div>

        <!-- ==================== PAGE 2 OF 2 ==================== -->
        <div class="t3-page t3-page-2">
          <!-- Page 2 Header -->
          <div class="t3-tag">TEMPLATE T-3 (Contd.)</div>
          <div class="t3-title" style="font-size: 13pt;">Work Order / Purchase Order (WO/PO) - Standard Conditions &amp; Acceptance</div>
          <div class="t3-header-divider"></div>

          <!-- Conditions 8 to 12 -->
          <div class="t3-condition-p2">
            <strong>8. No assignment / subletting.</strong> Supplier shall not transfer this order or sublet substantial work without buyer's written consent.
          </div>
          <div class="t3-condition-p2">
            <strong>9. Cancellation.</strong> Buyer may cancel for supplier's breach, insolvency, or misrepresentation (including invalid GST registration) without liability beyond payment for conforming goods already accepted.
          </div>
          <div class="t3-condition-p2">
            <strong>10. Force majeure.</strong> Neither party is liable for delay caused by events genuinely beyond its control, provided notice is given within 7 days; the affected timeline extends accordingly.
          </div>
          <div class="t3-condition-p2">
            <strong>11. Disputes &amp; jurisdiction.</strong> Parties will first attempt amicable settlement. Subject thereto, courts at ${jurisdictionLocation} (buyer's location) have exclusive jurisdiction.
          </div>
          <div class="t3-condition-p2">
            <strong>12. Entire agreement &amp; precedence.</strong> This PO with its annexures is the entire agreement and supersedes prior discussions. If a Special Condition (Part B) conflicts with a Standard Condition, the Special Condition prevails.
          </div>

          <!-- Part B Section Heading -->
          <div class="t3-section-heading" style="margin-top: 10pt;">Part B - Special Conditions (fill only if needed for this order)</div>

          <!-- Part B Table -->
          <table class="t3-partb-table">
            <thead>
              <tr>
                <th style="width: 28pt; text-align: center;">S.No</th>
                <th style="width: 347pt; text-align: left;">Special condition for this order</th>
                <th style="width: 140pt; text-align: center;">Overrides Standard Condition No. (if any)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align: center;">1</td>
                <td style="text-align: left;">${specialRow1Desc}</td>
                <td style="text-align: center;">${specialRow1Override}</td>
              </tr>
              <tr>
                <td style="text-align: center;">2</td>
                <td style="text-align: left;">${specialRow2Desc}</td>
                <td style="text-align: center;">${specialRow2Override}</td>
              </tr>
              <tr>
                <td style="text-align: center;">3</td>
                <td style="text-align: left;">&nbsp;</td>
                <td style="text-align: center;">&nbsp;</td>
              </tr>
            </tbody>
          </table>

          <!-- Part B Footnote -->
          <div class="t3-partb-footnote">
            If no Special Conditions are written above, only Part A applies. Typical uses: stage-wise delivery schedule, price variation formula for long orders, buyer-supplied material, inspection by buyer before dispatch, packing/marking instructions for export, tooling ownership.
          </div>

          <!-- Signatures Section -->
          <div class="t3-signatures-row">
            <div class="t3-sig-card">
              <div class="t3-sig-title">For Buyer - Authorised Signatory &amp; Seal</div>
              <div class="t3-sig-party">${b.name || 'Apex Green Metals Pvt Ltd'}</div>
              ${(po.buyer_approval_status === "SIGNED" || po.buyer_signatory_name) ? `
                <div class="t3-sig-signed" style="font-size: 6.8pt; color: #1b4332; font-weight: bold; margin: 3pt 0 1pt 0;">
                  ✍️ Signed: ${po.buyer_signatory_name || b.contact_name || 'Procurement Desk'}
                </div>
              ` : `
                <div class="t3-sig-signed" style="font-size: 6.2pt; color: #777777; font-style: italic; margin: 3pt 0 1pt 0;">
                  (Pending Buyer Signature)
                </div>
              `}
              <div class="t3-sig-divider"></div>
              <div class="t3-sig-bottom">
                <span>Authorised Signatory &amp; Seal</span>
                <span>Date: ${po.buyer_signed_date || po.po_date || po.date_display || '____________'}</span>
              </div>
            </div>
            <div class="t3-sig-card">
              <div class="t3-sig-title">Accepted - For Supplier (Signatory, Seal &amp; Date)</div>
              <div class="t3-sig-party">${v.name || 'Vendor'}</div>
              ${po.supplier_response_status === "ACCEPTED" ? `
                <div class="t3-sig-signed" style="font-size: 6.8pt; color: #1b4332; font-weight: bold; margin: 3pt 0 1pt 0;">
                  ✍️ Accepted: ${po.supplier_signatory_name || v.contact_name || v.name}
                </div>
              ` : po.supplier_response_status === "DECLINED" ? `
                <div class="t3-sig-signed" style="font-size: 6.8pt; color: #c82333; font-weight: bold; margin: 3pt 0 1pt 0;">
                  ❌ Declined by Supplier
                </div>
              ` : `
                <div class="t3-sig-signed" style="font-size: 6.2pt; color: #777777; font-style: italic; margin: 3pt 0 1pt 0;">
                  (Awaiting Supplier Acceptance)
                </div>
              `}
              <div class="t3-sig-divider"></div>
              <div class="t3-sig-bottom">
                <span>Authorised Signatory &amp; Stamp</span>
                <span>Date: ${po.supplier_response_date || '____________'}</span>
              </div>
            </div>
          </div>

          <!-- Purechain Note (T-3) -->
          <div class="t3-purechain-note">
            <div class="t3-note-title">Purechain note (T-3)</div>
            <div class="t3-note-body">
              Condition 7 is Purechain's quiet superpower: it contractually secures the CBAM/EUDR/DPP data rights from suppliers that sustainability, Supplier Discovery and digital passport compliance will later need - before the EU buyer ever asks. PureChain generates this PO from the accepted bid in T-2; supplier acceptance on WhatsApp is captured and stored as the acceptance record.
            </div>
          </div>
        </div>

      </div>
    `;
  },

  recordBuyerPoSignOff: function(poRef, buyerSignatoryName) {
    const po = this.shared_store.current_po;
    if (!po || (poRef && po.po_ref !== poRef)) return null;

    po.buyer_signatory_name = buyerSignatoryName || this.buyer.contact_name || "Procurement Desk";
    if (!po.buyer_signed_at) {
      po.buyer_signed_at = new Date().toISOString();
      po.buyer_signed_date = new Date().toLocaleDateString('en-GB') + " " + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }
    po.buyer_approval_status = "SIGNED";
    po.overall_status = "AWAITING_SUPPLIER_RESPONSE";
    po.document_version = "buyer_signed";

    // Re-render official T-3 document with buyer signature
    po.document_html = this.generatePoDocumentHtml(po);
    po.document_versions = po.document_versions || {};
    po.document_versions.buyer_signed = po.document_html;
    this.shared_store.current_po_document = po.document_html;

    if (po.milestones && po.milestones[0]) {
      po.milestones[0].label = "PO Generated & Digitally Dispatched";
      po.milestones[0].status = "COMPLETED";
      po.milestones[0].date = po.buyer_signed_date || po.po_date || po.date_display;
    }
    if (po.milestones && po.milestones[1]) {
      po.milestones[1].label = "Supplier Commercial Acceptance";
      po.milestones[1].status = "PENDING";
      po.milestones[1].date = null;
    }

    return po;
  },

  recordSupplierPoAcceptance: function(poRef, supplierId, signatoryName) {
    const po = this.shared_store.current_po;
    if (!po || (poRef && po.po_ref !== poRef)) return null;

    if (po.supplier_response_status === "DECLINED") {
      throw new Error("Cannot accept a Purchase Order that has already been declined.");
    }
    if (po.supplier_response_status === "ACCEPTED") {
      return po; // Idempotent
    }

    const supp = this.getSupplierById(supplierId) || (po.vendor && po.vendor.id === supplierId ? po.vendor : {});
    const finalSignatoryName = signatoryName || supp.contact_name || (po.vendor && po.vendor.contact_name) || (supp.name + " Authorized Signatory");

    po.supplier_signatory_name = finalSignatoryName;
    po.supplier_response_status = "ACCEPTED";
    po.supplier_response_at = new Date().toISOString();
    po.supplier_response_date = new Date().toLocaleDateString('en-GB') + " " + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    po.overall_status = "ACCEPTED_BY_BOTH_PARTIES";
    po.status = "ACCEPTED";
    po.document_version = "mutually_accepted";

    // Re-render official T-3 document with both buyer and supplier signatures
    po.document_html = this.generatePoDocumentHtml(po);
    po.document_versions = po.document_versions || {};
    po.document_versions.mutually_accepted = po.document_html;
    this.shared_store.current_po_document = po.document_html;

    if (po.milestones && po.milestones[1]) {
      po.milestones[1].label = "Supplier Commercial Acceptance";
      po.milestones[1].status = "COMPLETED";
      po.milestones[1].date = po.supplier_response_date;
    }

    return po;
  },

  recordSupplierPoDecline: function(poRef, supplierId) {
    const po = this.shared_store.current_po;
    if (!po || (poRef && po.po_ref !== poRef)) return null;

    if (po.supplier_response_status === "ACCEPTED") {
      throw new Error("Cannot decline a Purchase Order that has already been accepted.");
    }
    if (po.supplier_response_status === "DECLINED") {
      return po; // Idempotent
    }

    po.supplier_response_status = "DECLINED";
    po.supplier_response_at = new Date().toISOString();
    po.supplier_response_date = new Date().toLocaleDateString('en-GB') + " " + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    po.overall_status = "DECLINED_BY_SUPPLIER";
    po.status = "DECLINED";
    po.document_version = "declined";

    // Re-render document: retains buyer signature, reflects decline on supplier card
    po.document_html = this.generatePoDocumentHtml(po);
    po.document_versions = po.document_versions || {};
    po.document_versions.declined = po.document_html;
    this.shared_store.current_po_document = po.document_html;

    if (po.milestones && po.milestones[1]) {
      po.milestones[1].label = "Supplier Commercial Acceptance";
      po.milestones[1].status = "CANCELLED";
      po.milestones[1].date = po.supplier_response_date;
    }

    return po;
  },

  acknowledgePurchaseOrder: function(poRef, supplierId) {
    return this.recordSupplierPoAcceptance(poRef, supplierId, null);
  }
};

if (typeof window !== "undefined") {
  window.PROCUREMENT_DATA = PROCUREMENT_DATA;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = PROCUREMENT_DATA;
}

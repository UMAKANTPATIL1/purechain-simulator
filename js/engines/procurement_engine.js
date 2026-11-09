/**
 * Purechain AI — Multi-User Procurement Engine (Stage 1)
 *
 * Coordinates multi-user WhatsApp simulation across 4 participants:
 * - Buyer: Apex Green Metals Pvt Ltd
 * - Supplier 1: Test Supplier Pvt Ltd
 * - Supplier 2: UJJIVAN SMALL FINANCE BANK LIMITED
 * - Supplier 3: Supplier Test
 *
 * Handles:
 * 1. Independent, persistent conversation histories per participant.
 * 2. Guided RFQ creation for Onion (with exact 9 RFQ terms).
 * 3. RFQ dispatch broadcast simulation with unread badges.
 * 4. Guided quotation submission per supplier with all 6 required fields.
 * 5. Buyer status monitoring with real-time submission tracking.
 */

class ProcurementEngine {
  constructor(app) {
    this.app = app;
    this.active_participant = "buyer"; // 'buyer' | 'supplier_1' | 'supplier_2' | 'supplier_3'
    this.reset();
  }

  reset() {
    PROCUREMENT_DATA.initStore();
    this.active_participant = "buyer";

    const currentYear = new Date().getFullYear();
    const rfqRef = `PC-RFQ-${currentYear}-0113`;
    if (typeof PROCUREMENT_DATA !== 'undefined' && PROCUREMENT_DATA.shared_store) {
      PROCUREMENT_DATA.shared_store.current_rfq_ref = rfqRef;
    }

    // Buyer state machine variables
    this.buyer_state = {
      step: "INIT",
      material_id: "mat_onion",
      quantity: 50.0,
      unit: "MT",
      technical_specs: "Grade A Red Onion (45-60mm), Moisture < 14%, 50 kg mesh bags",
      delivery_location: null,
      registered_address: null,
      quotation_deadline: null,
      quote_validity: null,
      payment_terms: null,
      delivery_required_by: null,
      gstin: null,
      contact_name: "Procurement Desk",
      contact_phone: "+91 90000 00000 (Demo placeholder)",
      contact_email: "procurement@example.com",
      is_demo_contact: true,
      editing_contact_field: null,
      terms: {
        term_1: null,
        term_2: null,
        term_3: null,
        term_4: null,
        term_5: null,
        term_6: null,
        term_7: null,
        term_8: null
      },
      is_editing_term: null,
      terms_accepted: true,
      selected_suppliers: ["supplier_1", "supplier_2", "supplier_3"],
      rfq_ref: rfqRef
    };

    // Supplier state machine variables
    this.supplier_states = {
      supplier_1: this.createInitialSupplierState("supplier_1"),
      supplier_2: this.createInitialSupplierState("supplier_2"),
      supplier_3: this.createInitialSupplierState("supplier_3")
    };

    this.state = {
      step: "INIT",
      active_participant: "buyer"
    };

    this.updateSidebarUI();
  }

  switchParticipant(participantId) {
    this.active_participant = participantId;
    this.state.active_participant = participantId;
    if (participantId === "buyer") {
      this.state.step = this.buyer_state.step;
    } else {
      const s = this.supplier_states[participantId];
      this.state.step = s ? s.step : "INIT";
    }
  }

  getHistory(participantId) {
    return PROCUREMENT_DATA.shared_store.conversation_histories[participantId] || [];
  }

  recordMessage(participantId, msg) {
    if (!PROCUREMENT_DATA.shared_store.conversation_histories[participantId]) {
      PROCUREMENT_DATA.shared_store.conversation_histories[participantId] = [];
    }
    PROCUREMENT_DATA.shared_store.conversation_histories[participantId].push(msg);
  }

  loadParticipantConversation(participantId, animate = false) {
    this.switchParticipant(participantId);
    window.chatView.clearChat();

    // Mark unread as 0 for this participant
    PROCUREMENT_DATA.shared_store.unread_counts[participantId] = 0;
    this.updateSidebarUI();

    const history = this.getHistory(participantId);

    if (history.length === 0) {
      // First time loading this participant
      const initialMsg = this.getInitialMessageForParticipant(participantId);
      this.recordMessage(participantId, initialMsg);
      if (animate) {
        window.chatView.showTyping(true);
        setTimeout(() => {
          window.chatView.showTyping(false);
          window.chatView.appendMessage(initialMsg);
          this.app.updateProgressBanner();
        }, 400);
      } else {
        window.chatView.appendMessage(initialMsg, false);
        this.app.updateProgressBanner();
      }
    } else {
      // Render all preserved messages sequentially
      history.forEach((m, idx) => {
        window.chatView.appendMessage(m, false);
      });
      this.app.updateProgressBanner();
      window.chatView.scrollToBottom();
    }
  }

  updateSidebarUI() {
    const store = PROCUREMENT_DATA.shared_store;

    // Update snippets
    const buyerSnippet = document.getElementById("snippet_buyer");
    if (buyerSnippet && store.last_snippets["buyer"]) {
      buyerSnippet.innerText = store.last_snippets["buyer"];
    }

    ["supplier_1", "supplier_2", "supplier_3"].forEach(suppId => {
      const el = document.getElementById(`snippet_${suppId}`);
      if (el && store.last_snippets[suppId]) {
        el.innerText = store.last_snippets[suppId];
      }

      // Unread badge indicator
      const tabEl = (typeof document !== 'undefined' && document.getElementById) ? document.getElementById(`tab_${suppId}`) : null;
      if (tabEl) {
        let badge = tabEl.querySelector ? tabEl.querySelector(".unread-badge-pill") : null;
        const count = store.unread_counts[suppId] || 0;
        if (count > 0) {
          if (!badge && typeof document !== 'undefined' && document.createElement) {
            badge = document.createElement("span");
            badge.className = "unread-badge-pill";
            badge.style.cssText = "background-color: #00a884; color: #fff; font-size: 11px; font-weight: bold; border-radius: 10px; padding: 2px 7px; margin-left: 6px;";
            const previewRow = tabEl.querySelector ? tabEl.querySelector(".wf-preview-row") : null;
            if (previewRow && previewRow.appendChild) previewRow.appendChild(badge);
          }
          if (badge) {
            badge.innerText = count.toString();
            badge.style.display = "inline-block";
          }
        } else if (badge) {
          badge.style.display = "none";
        }
      }
    });
  }

  getInitialMessage() {
    return this.getInitialMessageForParticipant(this.active_participant);
  }

  getInitialMessageForParticipant(participantId) {
    if (participantId === "buyer") {
      const lines = [
        "🏢 *Purechain AI — Buyer Procurement Desk*",
        `Entity: *${PROCUREMENT_DATA.buyer.name}*\n`,
        "Welcome to the interactive WhatsApp Procurement Simulator. I will guide you step-by-step through creating, reviewing, and broadcasting a Request for Quotation (RFQ).\n",
        "• Selected Commodity: *Onion (Fresh Red Onion)*",
        "• Verified Supplier Network: *3 Pre-screened Vendors*\n",
        "_Tap below to start your RFQ creation:_"
      ];

      return {
        sender: "purechain",
        text: lines.join("\n"),
        buttons: [
          { id: "btn_buyer_start_rfq", text: "📋 Create RFQ for Onion" }
        ],
        step: "INIT"
      };
    } else {
      // Supplier chat
      const supp = PROCUREMENT_DATA.getSupplierById(participantId);
      const isDispatched = PROCUREMENT_DATA.shared_store.rfq_dispatched;

      if (!isDispatched) {
        return {
          sender: "purechain",
          text: `🌿 *Purechain AI — Verified Supplier Portal*\n\nWelcome *${supp.name}* (${supp.location}).\n\n• GST Status: *${supp.gst_status}*\n• Verified Commodity Match: *${supp.match}*\n\n🟢 *System Status:* Online & Connected.\n\n_No active RFQ has been assigned to your organization yet. You will receive an instant notification here when a buyer broadcasts an RFQ._`,
          buttons: [],
          step: "AWAITING"
        };
      } else {
        return this.renderSupplierIncomingRfqMessage(supp);
      }
    }
  }

  createInitialSupplierState(supplierId) {
    return {
      step: "INIT",
      current_field: 1,
      data: {
        unit_rate_val: null,
        unit_rate_unit: null,
        unit_rate_display: null,
        qty_in_quoted_unit: null,
        base_amount: 0,
        rate_per_kg: null,
        rate_per_mt: null,
        calc_str: "",
        gst_rate: null,
        gst_display: null,
        gst_amount: 0,
        freight_amount: null,
        freight_display: null,
        freight_type_display: "",
        delivery_period: null,
        payment_terms: null,
        quotation_validity: null,
        quality_docs: null,
        total_landed_amount: 0
      },
      editing_field: null,
      draft_quote: null
    };
  }

  renderSupplierIncomingRfqMessage(supp) {
    const rfq = PROCUREMENT_DATA.shared_store.current_rfq || {};
    const tCfg = rfq.terms_config || (rfq.terms && typeof rfq.terms === 'object' && !Array.isArray(rfq.terms) ? rfq.terms : {});

    const t1 = tCfg.term_1 || 'Not specified';
    const t2 = rfq.delivery_location || tCfg.term_2 || 'Not specified';
    const t3 = rfq.payment_terms || tCfg.term_3 || 'Not specified';
    const t4 = tCfg.term_4 || 'Not specified';
    const t5 = tCfg.term_5 || 'Not specified';
    const t6 = tCfg.term_6 || 'Not specified';
    const t7 = tCfg.term_7 || 'Not specified';
    const t8 = tCfg.term_8 || 'Not specified';

    const b = rfq.buyer || {};
    const contactParts = [];
    if (b.contact_name) contactParts.push(b.contact_name);
    if (b.contact_phone) contactParts.push(b.contact_phone);
    if (b.contact_email) contactParts.push(b.contact_email);
    const contactDisplay = contactParts.length > 0 ? contactParts.join(" • ") : "Procurement Desk • +91 90000 00000 (Demo placeholder) • procurement@example.com";

    const deliveryRequiredBy = rfq.delivery_required_by || "Not specified";

    const lines = [
      `📨 *NEW REQUEST FOR QUOTATION (RFQ) RECEIVED*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🏷️ *RFQ Number:* \`${rfq.rfq_ref || 'PC-RFQ-2026-0113'}\``,
      `🏢 *Buyer Company Name:* ${(rfq.buyer && rfq.buyer.name) || 'Apex Green Metals Pvt Ltd'}`,
      `👤 *Buyer Contact Details:* ${contactDisplay}`,
      `👤 *Invited Vendor:* *${supp ? supp.name : 'Supplier'}*`,
      `📦 *Commodity / Item:* *${rfq.material || 'Onion'}*`,
      `⚖️ *RFQ Quantity & Unit:* *${(rfq.quantity || 50).toLocaleString()} ${rfq.unit || 'MT'}*`,
      `📍 *Delivery Destination:* ${t2}`,
      `📅 *Required Delivery Date/Period:* ${deliveryRequiredBy}`,
      `⏰ *Quotation Deadline:* *${rfq.quotation_deadline || 'Not specified'}*\n`,
      `📋 *TECHNICAL SPECIFICATIONS:*`,
      `• Variety: ${(rfq.detailed_specs && rfq.detailed_specs.variety) || 'Grade A Nashik Red Onion'}`,
      `• Size / Diameter: ${(rfq.detailed_specs && rfq.detailed_specs.size) || '45-60mm export quality'}`,
      `• Moisture Limit: ${(rfq.detailed_specs && rfq.detailed_specs.moisture) || '< 14% max tolerance'}`,
      `• Quality Grade: ${(rfq.detailed_specs && rfq.detailed_specs.quality) || 'Sortex cleaned, dry, firm, pink/red'}`,
      `• Packaging: ${(rfq.detailed_specs && rfq.detailed_specs.packaging) || '50 kg new leno ventilated mesh bags'}\n`,
      `📜 *BUYER-APPROVED COMMERCIAL TERMS (T-1):*`,
      `1. *Price basis:* ${t1}`,
      `2. *Delivery location:* ${t2}`,
      `3. *Payment terms offered:* ${t3}`,
      `4. *GST & invoicing:* ${t4}`,
      `5. *Quality documents:* ${t5}`,
      `6. *Origin declaration:* ${t6}`,
      `7. *How to submit:* ${t7}`,
      `8. *Right of buyer:* ${t8}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n`,
      `📝 *INSTRUCTIONS FOR SUBMITTING A QUOTATION:*`,
      `Please review the technical specifications and commercial terms above. To submit your quotation, click *"📝 Submit Commercial Quotation"* below. You will be guided through the 7 mandatory quotation fields (Quoted unit rate, GST rate, Freight charges, Delivery period, Payment terms, Quotation validity, and Quality documents offered).\n`,
      `_Click below to begin quotation submission:_`
    ];

    return {
      sender: "purechain",
      text: lines.join("\n"),
      buttons: [
        { id: "btn_preview_rfq_doc", text: "📄 Preview RFQ Document" },
        { id: "btn_supp_start_quote", text: "📝 Submit Commercial Quotation" }
      ],
      step: "RECEIVED"
    };
  }

  handleUserAction(actionId, textInput) {
    const cleanAction = (actionId || "").toLowerCase();

    // Universal Document Preview
    if (cleanAction === "btn_preview_rfq_doc") {
      const s = this.buyer_state;
      let rfq = PROCUREMENT_DATA.shared_store.current_rfq;
      if (!rfq && s) {
        rfq = this.syncRfqStore();
      }
      window.documentModal.showReportPreview("RFQ_DOCUMENT", rfq);
      return null;
    }

    if (cleanAction === "btn_preview_comparison_doc") {
      const s = this.buyer_state;
      let report = PROCUREMENT_DATA.shared_store.current_comparison;
      if (!report) {
        report = PROCUREMENT_DATA.generateComparativeStatement(s ? s.rfq_ref : null);
      }
      if (typeof window !== "undefined" && window.documentModal) {
        window.documentModal.showReportPreview("COMPARISON_DOCUMENT", report);
      }
      return null;
    }

    if (cleanAction === "btn_preview_po_doc") {
      let po = PROCUREMENT_DATA.shared_store.current_po;
      if (!po && this.buyer_state && this.buyer_state.po_ref) {
        po = (PROCUREMENT_DATA.shared_store.purchase_orders || []).find(p => p.po_ref === this.buyer_state.po_ref);
      }
      if (!po && this.buyer_state && (this.buyer_state.step === "PO_REVIEW" || this.buyer_state.step === "PO_SIGN_CONFIRM")) {
        po = this.getOrCreateDraftPo();
      }
      if (typeof window !== "undefined" && window.documentModal) {
        window.documentModal.showReportPreview("PO_DOCUMENT", po);
      }
      return null;
    }

    if (this.active_participant === "buyer") {
      return this.handleBuyerAction(cleanAction, textInput);
    } else {
      return this.handleSupplierAction(this.active_participant, cleanAction, textInput);
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BUYER CONVERSATION FLOW
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  handleBuyerAction(actionId, textInput) {
    const s = this.buyer_state;

    // Direct Action & Document Preview Handlers
    if (actionId === "btn_buyer_check_status") {
      return this.renderBuyerQuotationStatus();
    }

    if (actionId === "btn_buyer_check_po_status") {
      return this.renderBuyerPoStatus();
    }

    if (actionId === "btn_preview_po_doc") {
      let po = PROCUREMENT_DATA.shared_store.current_po;
      if (!po && s && (s.step === "PO_REVIEW" || s.step === "PO_SIGN_CONFIRM")) {
        po = this.getOrCreateDraftPo();
      }
      if (typeof window !== "undefined" && window.documentModal) {
        window.documentModal.showReportPreview("PO_DOCUMENT", po);
      }
      return null;
    }

    if (actionId === "btn_buyer_generate_comparison") {
      return this.executeGenerateComparison();
    }

    if (actionId === "btn_preview_comparison_doc") {
      const report = PROCUREMENT_DATA.shared_store.current_comparison || PROCUREMENT_DATA.generateComparativeStatement(s ? s.rfq_ref : null);
      if (typeof window !== "undefined" && window.documentModal) {
        window.documentModal.showReportPreview("COMPARISON_DOCUMENT", report);
      }
      return null;
    }

    if (actionId === "btn_buyer_start_po") {
      return this.initiatePurchaseOrderWorkflow();
    }

    if (actionId && actionId.startsWith("btn_po_select_")) {
      return this.handlePoSupplierSelection(actionId.replace("btn_po_select_", ""), textInput);
    }

    if (actionId === "btn_po_change_supplier") {
      return this.initiatePurchaseOrderWorkflow();
    }

    if (actionId === "btn_po_confirm_full_qty" || (s && s.step === "PO_CONFIRM_QUANTITY" && textInput)) {
      return this.handlePoQuantityInput(actionId, textInput);
    }

    if (actionId === "btn_buyer_accept_sign_po") {
      const rfqRef = s.po_rfq_ref || s.rfq_ref || "PC-RFQ-2026-0113";
      const report = PROCUREMENT_DATA.shared_store.current_comparison || PROCUREMENT_DATA.generateComparativeStatement(rfqRef);
      const col = (report && report.columns) ? report.columns.find(c => c.supplier_id === s.po_selected_supplier_id) : null;
      return this.renderPoSignConfirmationPrompt(s, col, report);
    }

    if (actionId === "btn_buyer_cancel_sign") {
      s.step = "PO_REVIEW";
      this.state.step = "PO_REVIEW";
      const rfqRef = s.po_rfq_ref || s.rfq_ref || "PC-RFQ-2026-0113";
      const report = PROCUREMENT_DATA.shared_store.current_comparison || PROCUREMENT_DATA.generateComparativeStatement(rfqRef);
      const col = (report && report.columns) ? report.columns.find(c => c.supplier_id === s.po_selected_supplier_id) : null;
      return this.renderPoReviewPrompt(s, col, report);
    }

    if (actionId === "btn_buyer_confirm_send_supplier" || actionId === "btn_buyer_confirm_po_dispatch") {
      return this.executePoDispatch();
    }

    if (s && s.step === "PO_SELECT_SUPPLIER" && textInput) {
      return this.handlePoSupplierSelection(null, textInput);
    }

    if (actionId === "btn_preview_rfq_doc") {
      this.syncRfqStore();
      if (typeof window !== "undefined" && window.documentModal) {
        window.documentModal.showReportPreview("RFQ_DOCUMENT", PROCUREMENT_DATA.shared_store.current_rfq);
      }
      return null;
    }

    if (actionId === "btn_edit_buyer_contact") {
      return this.renderEditContactPrompt(s, null);
    }
    if (actionId === "btn_contact_edit_name") {
      return this.renderEditContactPrompt(s, "name");
    }
    if (actionId === "btn_contact_edit_phone") {
      return this.renderEditContactPrompt(s, "phone");
    }
    if (actionId === "btn_contact_edit_email") {
      return this.renderEditContactPrompt(s, "email");
    }
    if (actionId === "btn_contact_reset_demo") {
      s.contact_name = "Procurement Desk";
      s.contact_phone = "+91 90000 00000 (Demo placeholder)";
      s.contact_email = "procurement@example.com";
      s.is_demo_contact = true;
      s.editing_contact_field = null;
      this.syncRfqStore();
      return this.renderBuyerRfqReview();
    }
    if (s.step === "EDIT_CONTACT") {
      if (textInput && textInput.trim()) {
        const txt = textInput.trim();
        if (s.editing_contact_field === "name") {
          s.contact_name = txt;
          s.is_demo_contact = false;
        } else if (s.editing_contact_field === "phone") {
          s.contact_phone = txt;
          s.is_demo_contact = false;
        } else if (s.editing_contact_field === "email") {
          s.contact_email = txt;
          s.is_demo_contact = false;
        } else {
          // General format parsing: "Name, Phone, Email"
          if (txt.includes(",")) {
            const parts = txt.split(",").map(p => p.trim());
            if (parts[0]) s.contact_name = parts[0];
            if (parts[1]) s.contact_phone = parts[1];
            if (parts[2]) s.contact_email = parts[2];
            s.is_demo_contact = false;
          } else if (txt.includes("@")) {
            s.contact_email = txt;
            s.is_demo_contact = false;
          } else if (/^[\d+\s()-]{7,}$/.test(txt)) {
            s.contact_phone = txt;
            s.is_demo_contact = false;
          } else {
            s.contact_name = txt;
            s.is_demo_contact = false;
          }
        }
        s.editing_contact_field = null;
        this.syncRfqStore();
        return this.renderBuyerRfqReview();
      }
    }

    // Fast-Track Demo Shortcut (routes to standard RFQ creation)
    if (actionId === "btn_buyer_fast_track") {
      return this.handleBuyerAction("btn_buyer_start_rfq");
    }

    // Step 1: Start RFQ -> Material Selection
    if (actionId === "btn_buyer_start_rfq" || s.step === "INIT") {
      s.step = "SELECT_MATERIAL";
      this.state.step = "SELECT_MATERIAL";
      return {
        sender: "purechain",
        text: `📦 *Step 1 of 8: Select Commodity*\n\nPlease select the raw material / commodity for this RFQ:\n\n1️⃣ *Onion (Fresh Red Onion)*\n   _Category:_ Agro Commodity • Grade A Export Standard\n   _Verified Suppliers Available:_ 3 Active Vendors\n\n_Tap below to select:_`,
        buttons: [
          { id: "btn_buyer_select_onion", text: "🧅 Onion (Fresh Red Onion)" }
        ],
        step: "SELECT_MATERIAL"
      };
    }

    // Step 2: Material Selected -> Quantity & Unit
    if (actionId === "btn_buyer_select_onion" || s.step === "SELECT_MATERIAL") {
      s.step = "ENTER_QUANTITY";
      this.state.step = "ENTER_QUANTITY";
      return {
        sender: "purechain",
        text: `⚖️ *Step 2 of 8: Quantity & Measurement Unit*\n\nSelected Commodity: *Onion (Fresh Red Onion)*\n\nPlease specify the required consignment volume:\n\n• Standard Lot: *50 Metric Tonnes (MT)*\n• Bulk Lot: *100 Metric Tonnes (MT)*\n• Trial Lot: *25 Metric Tonnes (MT)*\n\n_Choose or enter quantity:_`,
        buttons: [
          { id: "btn_buyer_qty_50", text: "50 MT (Standard Consignment)" },
          { id: "btn_buyer_qty_100", text: "100 MT (Bulk Lot)" },
          { id: "btn_buyer_qty_25", text: "25 MT (Trial Lot)" }
        ],
        step: "ENTER_QUANTITY"
      };
    }

    // Step 3: Quantity Selected -> Technical Specifications
    if (actionId.startsWith("btn_buyer_qty_") || s.step === "ENTER_QUANTITY") {
      if (actionId.includes("100")) s.quantity = 100.0;
      else if (actionId.includes("25")) s.quantity = 25.0;
      else s.quantity = 50.0;

      s.step = "ENTER_SPECS";
      this.state.step = "ENTER_SPECS";
      const specs = PROCUREMENT_DATA.materials[0].specs;

      return {
        sender: "purechain",
        text: `🔬 *Step 3 of 8: Technical Quality Specifications*\n\nConsignment: *${s.quantity} MT of Onion*\n\n*Verified Quality Standards & Tolerances:*\n• Variety: *${specs.variety}*\n• Size Range: *${specs.size}*\n• Maximum Moisture: *${specs.moisture}*\n• Physical Condition: *${specs.quality}*\n• Packaging Requirement: *${specs.packaging}*\n\nPlease review and confirm quality parameters:`,
        buttons: [
          { id: "btn_buyer_confirm_specs", text: "✅ Confirm Technical Specifications" }
        ],
        step: "ENTER_SPECS"
      };
    }

    // Step 4: Specs Confirmed -> Quotation Deadline
    if (actionId === "btn_buyer_confirm_specs" || s.step === "ENTER_SPECS") {
      s.step = "ENTER_DEADLINE";
      this.state.step = "ENTER_DEADLINE";

      const now = new Date();
      const d1 = new Date(now.getTime() + 4 * 86400000);
      const d1Str = `${d1.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}, 14:00 IST`;
      const d1Btn = `${d1.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, 14:00 IST`;

      const d2 = new Date(now.getTime() + 8 * 86400000);
      const d2Str = `${d2.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}, 18:30 IST`;
      const d2Btn = `${d2.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, 18:30 IST`;

      const d3 = new Date(now.getTime() + 12 * 86400000);
      const d3Str = `${d3.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}, 16:00 IST`;
      const d3Btn = `${d3.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, 16:00 IST`;

      return {
        sender: "purechain",
        text: `⏰ *Step 4: Quotation Submission Deadline*\n\nPlease set the exact response deadline date & time for invited suppliers:\n\n1️⃣ *Option 1*: ${d1Str}\n2️⃣ *Option 2*: ${d2Str}\n3️⃣ *Option 3*: ${d3Str}\n4️⃣ *Leave blank*: Specify before dispatch\n\n_Choose deadline date & time, or type custom deadline:_`,
        buttons: [
          { id: "btn_buyer_deadline_opt1", text: d1Btn },
          { id: "btn_buyer_deadline_opt2", text: d2Btn },
          { id: "btn_buyer_deadline_opt3", text: d3Btn },
          { id: "btn_buyer_deadline_blank", text: "Leave Deadline Blank" }
        ],
        step: "ENTER_DEADLINE"
      };
    }

    // Step 4b: Deadline Selected -> Term 1 (Price Basis)
    if (actionId.startsWith("btn_buyer_deadline_") || actionId.startsWith("btn_buyer_dead_") || s.step === "ENTER_DEADLINE") {
      const now = new Date();
      if (actionId === "btn_buyer_deadline_opt1" || actionId.includes("3")) {
        const d1 = new Date(now.getTime() + 4 * 86400000);
        s.quotation_deadline = `${d1.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}, 14:00 IST`;
      } else if (actionId === "btn_buyer_deadline_opt3" || actionId.includes("14")) {
        const d3 = new Date(now.getTime() + 12 * 86400000);
        s.quotation_deadline = `${d3.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}, 16:00 IST`;
      } else if (actionId === "btn_buyer_deadline_blank" || actionId === "btn_buyer_dead_blank") {
        s.quotation_deadline = null;
      } else if (textInput && textInput.trim()) {
        s.quotation_deadline = textInput.trim();
      } else {
        const d2 = new Date(now.getTime() + 8 * 86400000);
        s.quotation_deadline = `${d2.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}, 18:30 IST`;
      }

      return this.renderTermQuestion1(s);
    }

    // Edit Menu Handlers
    if (actionId === "btn_edit_terms_menu") {
      return this.renderEditTermsMenu();
    }

    if (actionId === "btn_back_to_review") {
      s.is_editing_term = null;
      s.editing_contact_field = null;
      this.syncRfqStore();
      return this.renderBuyerRfqReview();
    }

    if (actionId.startsWith("btn_edit_t")) {
      const tNum = parseInt(actionId.replace("btn_edit_t", ""), 10);
      if (tNum >= 1 && tNum <= 8) {
        s.is_editing_term = tNum;
        return this["renderTermQuestion" + tNum](s);
      }
    }

    // Step 5: Term 1 (Price Basis)
    if (actionId.startsWith("btn_t1_") || s.step === "TERM_1") {
      if (actionId === "btn_t1_opt1") {
        s.terms.term_1 = "Per-unit rate with GST and freight separate";
      } else if (actionId === "btn_t1_opt2") {
        s.terms.term_1 = "FOR destination";
      } else if (actionId === "btn_t1_opt3") {
        s.terms.term_1 = "Ex-works";
      } else if (actionId === "btn_t1_skip") {
        s.terms.term_1 = "Not specified";
      } else if (textInput && textInput.trim()) {
        s.terms.term_1 = textInput.trim();
      }

      if (s.is_editing_term === 1) {
        s.is_editing_term = null;
        this.syncRfqStore();
        return this.renderBuyerRfqReview();
      }
      return this.renderTermQuestion2(s);
    }

    // Step 6: Term 2 (Delivery Location)
    if (actionId.startsWith("btn_t2_") || s.step === "TERM_2") {
      if (actionId === "btn_t2_skip") {
        s.terms.term_2 = "Not specified";
        s.delivery_location = null;
      } else if (textInput && textInput.trim()) {
        s.terms.term_2 = textInput.trim();
        s.delivery_location = textInput.trim();
      }

      if (s.is_editing_term === 2) {
        s.is_editing_term = null;
        this.syncRfqStore();
        return this.renderBuyerRfqReview();
      }
      return this.renderTermQuestion3(s);
    }

    // Step 7: Term 3 (Payment Terms Offered)
    if (actionId.startsWith("btn_t3_") || s.step === "TERM_3") {
      if (actionId === "btn_t3_opt1") {
        s.terms.term_3 = "100% after delivery";
      } else if (actionId === "btn_t3_opt2") {
        s.terms.term_3 = "100% after receipt and acceptance";
      } else if (actionId === "btn_t3_opt3") {
        s.terms.term_3 = "30% advance and 70% after delivery";
      } else if (actionId === "btn_t3_opt4") {
        s.terms.term_3 = "10% advance and balance after acceptance";
      } else if (actionId === "btn_t3_skip") {
        s.terms.term_3 = "Not specified";
        s.payment_terms = null;
      } else if (textInput && textInput.trim()) {
        s.terms.term_3 = textInput.trim();
        s.payment_terms = textInput.trim();
      }

      if (s.is_editing_term === 3) {
        s.is_editing_term = null;
        this.syncRfqStore();
        return this.renderBuyerRfqReview();
      }
      return this.renderTermQuestion4(s);
    }

    // Step 8: Term 4 (GST & Invoicing)
    if (actionId.startsWith("btn_t4_") || s.step === "TERM_4") {
      if (actionId === "btn_t4_opt1") {
        s.terms.term_4 = "Active GSTIN and GST tax invoice mandatory";
      } else if (actionId === "btn_t4_opt2") {
        s.terms.term_4 = "GST invoice and e-way bill required";
      } else if (actionId === "btn_t4_not_req") {
        s.terms.term_4 = "Not required";
      } else if (actionId === "btn_t4_skip") {
        s.terms.term_4 = "Not specified";
      } else if (textInput && textInput.trim()) {
        s.terms.term_4 = textInput.trim();
      }

      if (s.is_editing_term === 4) {
        s.is_editing_term = null;
        this.syncRfqStore();
        return this.renderBuyerRfqReview();
      }
      return this.renderTermQuestion5(s);
    }

    // Step 9: Term 5 (Quality Documents)
    if (actionId.startsWith("btn_t5_") || s.step === "TERM_5") {
      if (actionId === "btn_t5_opt1") {
        s.terms.term_5 = "Certificate of Analysis";
      } else if (actionId === "btn_t5_opt2") {
        s.terms.term_5 = "Manufacturer test certificate";
      } else if (actionId === "btn_t5_opt3") {
        s.terms.term_5 = "Weighment slip";
      } else if (actionId === "btn_t5_opt4") {
        s.terms.term_5 = "Quality certificate";
      } else if (actionId === "btn_t5_not_req") {
        s.terms.term_5 = "Not required";
      } else if (actionId === "btn_t5_skip") {
        s.terms.term_5 = "Not specified";
      } else if (textInput && textInput.trim()) {
        s.terms.term_5 = textInput.trim();
      }

      if (s.is_editing_term === 5) {
        s.is_editing_term = null;
        this.syncRfqStore();
        return this.renderBuyerRfqReview();
      }
      return this.renderTermQuestion6(s);
    }

    // Step 10: Term 6 (Origin Declaration)
    if (actionId.startsWith("btn_t6_") || s.step === "TERM_6") {
      if (actionId === "btn_t6_yes" || actionId === "btn_t6_opt1") {
        s.terms.term_6 = "Required";
      } else if (actionId === "btn_t6_no" || actionId === "btn_t6_not_req") {
        s.terms.term_6 = "Not required";
      } else if (actionId === "btn_t6_skip") {
        s.terms.term_6 = "Not specified";
      } else if (textInput && textInput.trim()) {
        const low = textInput.trim().toLowerCase();
        if (low === "yes" || low === "required") s.terms.term_6 = "Required";
        else if (low === "no" || low === "not required") s.terms.term_6 = "Not required";
        else s.terms.term_6 = textInput.trim();
      }

      if (s.is_editing_term === 6) {
        s.is_editing_term = null;
        this.syncRfqStore();
        return this.renderBuyerRfqReview();
      }
      return this.renderTermQuestion7(s);
    }

    // Step 11: Term 7 (How to Submit)
    if (actionId.startsWith("btn_t7_") || s.step === "TERM_7") {
      if (actionId === "btn_t7_opt1") {
        s.terms.term_7 = "WhatsApp reply";
      } else if (actionId === "btn_t7_opt2") {
        s.terms.term_7 = "Official email with quotation PDF";
      } else if (actionId === "btn_t7_opt3") {
        s.terms.term_7 = "WhatsApp or email";
      } else if (actionId === "btn_t7_skip") {
        s.terms.term_7 = "Not specified";
      } else if (textInput && textInput.trim()) {
        s.terms.term_7 = textInput.trim();
      }

      if (s.is_editing_term === 7) {
        s.is_editing_term = null;
        this.syncRfqStore();
        return this.renderBuyerRfqReview();
      }
      return this.renderTermQuestion8(s);
    }

    // Step 12: Term 8 (Right of Buyer)
    if (actionId.startsWith("btn_t8_") || s.step === "TERM_8") {
      if (actionId === "btn_t8_confirm" || actionId === "btn_t8_opt1") {
        s.terms.term_8 = "Buyer reserves the right to accept any quote in whole or in part, reject any or all quotes without assigning reasons, and split quantities across multiple suppliers.";
      } else if (actionId === "btn_t8_not_req") {
        s.terms.term_8 = "Not required";
      } else if (actionId === "btn_t8_skip") {
        s.terms.term_8 = "Not specified";
      } else if (textInput && textInput.trim()) {
        s.terms.term_8 = textInput.trim();
      }

      if (s.is_editing_term === 8) {
        s.is_editing_term = null;
        this.syncRfqStore();
        return this.renderBuyerRfqReview();
      }

      // Proceed to Supplier Selection
      s.step = "SELECT_SUPPLIERS";
      this.state.step = "SELECT_SUPPLIERS";
      s.selected_suppliers = ["supplier_1", "supplier_2", "supplier_3"];

      const suppList = PROCUREMENT_DATA.suppliers.map((supp, idx) => {
        return `*Supplier ${idx + 1}*\n• Name: *${supp.name}*\n• Location: ${supp.location}\n• GST: *${supp.gst_status}*\n• Match: *${supp.match}*`;
      }).join("\n\n");

      return {
        sender: "purechain",
        text: `👥 *Step 6: Supplier Selection & Matching*\n\nFound 3 pre-verified suppliers matching commodity *Onion*:\n\n${suppList}\n\nAll 3 suppliers are currently selected for this RFQ:`,
        buttons: [
          { id: "btn_buyer_confirm_suppliers", text: "✅ Confirm All 3 Suppliers" }
        ],
        step: "SELECT_SUPPLIERS"
      };
    }

    // Step 13: Suppliers Confirmed -> Review Complete RFQ
    if (actionId === "btn_buyer_confirm_suppliers" || actionId === "btn_buyer_supp_confirm" || s.step === "SELECT_SUPPLIERS") {
      s.step = "REVIEW_RFQ";
      this.state.step = "REVIEW_RFQ";
      this.syncRfqStore();
      return this.renderBuyerRfqReview();
    }

    // Dispatch RFQ
    if (actionId === "btn_buyer_dispatch_rfq" || s.step === "REVIEW_RFQ") {
      return this.executeRfqDispatch();
    }

    if (actionId === "btn_buyer_deadline_dispatch_set") {
      const now = new Date();
      const dPrompt = new Date(now.getTime() + 6 * 86400000);
      s.quotation_deadline = `${dPrompt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}, 15:00 IST`;
      return this.executeRfqDispatch();
    }

    // Check Quotation Status Button
    if (actionId === "btn_buyer_check_status") {
      return this.renderBuyerQuotationStatus();
    }

    if (actionId === "btn_buyer_check_po_status") {
      return this.renderBuyerPoStatus();
    }

    if (actionId === "btn_preview_po_doc") {
      let po = PROCUREMENT_DATA.shared_store.current_po;
      if (typeof window !== "undefined" && window.documentModal) {
        window.documentModal.showReportPreview("PO_DOCUMENT", po);
      }
      return null;
    }

    // Generate Comparison Report Button (Buyer Action)
    if (actionId === "btn_buyer_generate_comparison") {
      return this.executeGenerateComparison();
    }

    if (actionId === "btn_preview_comparison_doc") {
      const report = PROCUREMENT_DATA.shared_store.current_comparison || PROCUREMENT_DATA.generateComparativeStatement(s.rfq_ref);
      if (typeof window !== "undefined" && window.documentModal) {
        window.documentModal.showReportPreview("COMPARISON_DOCUMENT", report);
      }
      return null;
    }

    return null;
  }

  executeGenerateComparison() {
    const s = this.buyer_state;
    const rfqRef = s.rfq_ref || (PROCUREMENT_DATA.shared_store.current_rfq ? PROCUREMENT_DATA.shared_store.current_rfq.rfq_ref : "PC-RFQ-2026-0113");
    const report = PROCUREMENT_DATA.generateComparativeStatement(rfqRef);

    // Automatically trigger preview in DocumentModal
    if (typeof window !== "undefined" && window.documentModal) {
      window.documentModal.showReportPreview("COMPARISON_DOCUMENT", report);
    }

    s.step = "COMPARISON_GENERATED";
    this.state.step = "COMPARISON_GENERATED";

    const lines = [
      `📊 *BID COMPARISON REPORT (TEMPLATE T-2) GENERATED*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🏷️ *Comparison Ref:* \`${report.comparison_ref}\` (${report.revision})`,
      `📄 *Against RFQ:* \`${report.rfq_ref}\``,
      `📦 *Item & Quantity:* ${report.item_and_quantity}`,
      `📋 *Quotes Considered:* ${report.quotes_summary_line}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n`,
      `📑 *DETAILED QUOTATION COMPARISON SUMMARY*\n`
    ];

    // Filter and sort submitted suppliers by commercial rank (L1, L2, L3)
    const submittedCols = report.columns
      .filter(c => c.status === "SUBMITTED")
      .sort((a, b) => (a.normalized_landed_per_kg || 0) - (b.normalized_landed_per_kg || 0));

    const pendingCols = report.columns.filter(c => c.status === "PENDING");

    if (submittedCols.length > 0) {
      submittedCols.forEach((col, idx) => {
        lines.push(
          `🏢 *${idx + 1}. ${col.supplier_name}* (${col.rank_display})`,
          `• *Commercial Ranking:* *${col.rank_code || col.rank_display}*`,
          `• *Original Quoted Rate:* *${col.quoted_rate_display}*`,
          `• *GST Rate & Amount:* ${col.gst_display}`,
          `• *Freight Charges:* ${col.freight_display}`,
          `• *Total Landed Cost:* *${col.total_landed_cost_display}*`,
          `• *Normalized Landed Cost (${col.landed_cost_per_unit_unit || report.unit || 'kg'}):* *${col.landed_cost_per_unit_display}*`,
          `• *Delivery Period:* ${col.delivery_period}`,
          `• *Payment Terms:* ${col.payment_terms}`,
          `• *Quotation Validity:* ${col.quote_validity}`,
          `• *Quality Documents Offered:* ${col.quality_docs}`,
          `• *RAKSHAK Statutory Verification:* *${col.rakshak_status}*`,
          ``
        );
      });
    } else {
      lines.push(`_No commercial quotations submitted yet._\n`);
    }

    // Pending suppliers
    if (pendingCols.length > 0) {
      lines.push(`⏳ *QUOTATIONS PENDING (${pendingCols.length} Awaiting Response)*`);
      pendingCols.forEach(p => {
        lines.push(`• *${p.supplier_name}:* Quotation pending (${p.location || 'Invited'})`);
      });
      lines.push(``);
    }

    // -------------------------------------------------------------
    // DAAM GURU Market Benchmark Comparison Section
    // -------------------------------------------------------------
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`📊 *DAAM GURU MARKET BENCHMARK COMPARISON*\n`);
    const bench = report.daam_guru_benchmark;

    if (bench) {
      lines.push(
        `• *Source:* ${bench.source || 'DAAM GURU Demo Dataset'}`,
        `• *Status:* Illustrative demo data — not live market prices`,
        `• *Commodity:* ${bench.commodity}`,
        `• *Market:* ${bench.market}, ${bench.state}`,
        `• *Benchmark date:* ${bench.price_date_display || bench.price_date}`,
        `• *Market price:* INR ${bench.normalized_price_per_kg.toFixed(2)}/kg\n`
      );

      const daamEngine = (typeof DAAM_GURU_DATA !== "undefined" ? DAAM_GURU_DATA : null) ||
                         (typeof window !== "undefined" && window.DAAM_GURU_DATA ? window.DAAM_GURU_DATA : null) ||
                         (typeof global !== "undefined" && global.DAAM_GURU_DATA ? global.DAAM_GURU_DATA : null) ||
                         (function() { try { return require("../data/daam_guru_data.js"); } catch (e) { return null; } })();

      submittedCols.forEach(col => {
        const comp = col.daam_guru_comparison || (daamEngine ? daamEngine.calculateComparison(col.normalized_landed_per_kg, bench.normalized_price_per_kg) : null);
        if (comp) {
          lines.push(
            `🏢 *${col.supplier_name}*`,
            `• Landed cost: INR ${col.normalized_landed_per_kg.toFixed(2)}/kg`,
            `• Market benchmark: INR ${bench.normalized_price_per_kg.toFixed(2)}/kg`,
            `• Difference: ${comp.diff_display_whatsapp}`,
            `• Position: ${comp.position}\n`
          );
        }
      });
    } else {
      lines.push(
        `_DAAM GURU benchmark unavailable — no matching demo market record._\n`
      );
    }

    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`🏆 *SYSTEM RECOMMENDATION*`);

    // IMPORTANT: Retrieve recommended supplier's OWN quotation record
    const recSupplierName = report.decision.recommended_supplier;
    const recCol = report.columns.find(c => c.supplier_name === recSupplierName && c.status === "SUBMITTED");

    if (recCol) {
      lines.push(
        `• *Recommended Supplier:* *${recCol.supplier_name}*`,
        `• *Actual Quoted Rate:* ${recCol.quoted_rate_display}`,
        `• *Own Landed Cost per Unit:* *${recCol.landed_cost_per_unit_display}*`,
        `• *Total Landed Cost:* *${recCol.total_landed_cost_display}*`,
        `• *Delivery Period:* ${recCol.delivery_period}`,
        `• *RAKSHAK Verification:* *${recCol.rakshak_status}*`,
        `• *Why Selected:* ${report.decision.reason}`,
        `• *Buyer Approval Status:* ⏳ *Pending buyer approval*`
      );
    } else {
      lines.push(
        `• *Status:* ⚠️ *No recommendation — verification pending or failed*`,
        `• *Reason:* ${report.decision.reason}`,
        `• *Buyer Approval Status:* ⏳ *Pending buyer approval*`
      );
    }

    lines.push(
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `_Note: PureChain MSME Golden Rule — evaluate total landed cost, not bare quoted rate. The recommendation is advisory; buyer approval remains pending until explicit selection._`
    );

    return {
      sender: "purechain",
      text: lines.join("\n"),
      buttons: [
        { id: "btn_preview_comparison_doc", text: "📄 View Comparison Report (T-2) PDF" },
        { id: "btn_buyer_start_po", text: "🛒 Proceed to Create Purchase Order (T-3)" }
      ],
      step: "COMPARISON_GENERATED"
    };
  }

  initiatePurchaseOrderWorkflow() {
    const s = this.buyer_state;
    const rfqRef = s.rfq_ref || (PROCUREMENT_DATA.shared_store.current_rfq ? PROCUREMENT_DATA.shared_store.current_rfq.rfq_ref : "PC-RFQ-2026-0113");
    const report = PROCUREMENT_DATA.shared_store.current_comparison || PROCUREMENT_DATA.generateComparativeStatement(rfqRef);

    // Carry forward RFQ reference, comparison reference, quotations, and recommendation
    s.po_rfq_ref = rfqRef;
    s.po_comparison_ref = report.comparison_ref;
    s.po_recommended_supplier = report.decision.recommended_supplier;
    s.po_selected_supplier_id = null; // Strictly neutral: no automatic or preselected supplier
    s.po_quantity = s.quantity || 50.0;
    s.po_unit = s.unit || "MT";
    s.po_approval_status = "PENDING";
    s.step = "PO_SELECT_SUPPLIER";
    this.state.step = "PO_SELECT_SUPPLIER";

    // All submitted quotations considered in current comparison
    const submittedCols = report.columns
      .filter(c => c.status === "SUBMITTED")
      .sort((a, b) => (a.normalized_landed_per_kg || 0) - (b.normalized_landed_per_kg || 0));

    const pendingCols = report.columns.filter(c => c.status === "PENDING");
    const recSupplierName = report.decision.recommended_supplier;

    const lines = [
      `🛒 *PURCHASE ORDER CREATION WORKFLOW (TEMPLATE T-3)*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `📄 *Against RFQ:* \`${report.rfq_ref}\``,
      `🏷️ *Comparison Ref:* \`${report.comparison_ref}\` (${report.revision})`,
      `📦 *Commodity & Requisition:* ${report.item_and_quantity}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n`,
      `📋 *STEP 1: BUYER SUPPLIER SELECTION & DECISION AUTHORITY*\n`,
      `• *T-2 Advisory Recommendation:* *${recSupplierName}* (Advisory only — final award decision rests entirely with the buyer).`,
      `• *Decision Governance:* The buyer has complete decision authority among eligible suppliers. No supplier is preselected or forced.\n`,
      `📑 *SUBMITTED QUOTATIONS CONSIDERED (${submittedCols.length}):*\n`
    ];

    if (submittedCols.length > 0) {
      submittedCols.forEach((col, idx) => {
        const isRec = col.supplier_name === recSupplierName;
        const eligibilityTag = col.is_recommendation_eligible
          ? `🟢 Eligible for PO Award`
          : col.is_rakshak_failed
            ? `🔴 Ineligible (Failed RAKSHAK statutory verification)`
            : `🟡 Ineligible (RAKSHAK statutory verification pending/unavailable)`;

        lines.push(
          `🏢 *${idx + 1}. ${col.supplier_name}* (${col.location}) ${isRec ? '— _T-2 Advisory Recommendation_' : ''}`,
          `• *Commercial Ranking:* *${col.rank_code || col.rank_display}*`,
          `• *Original Quoted Rate:* *${col.quoted_rate_display}*`,
          `• *GST Rate & Amount:* ${col.gst_display}`,
          `• *Freight Charges:* ${col.freight_display}`,
          `• *Total Landed Cost:* *${col.total_landed_cost_display}*`,
          `• *Normalized Landed Cost (${col.landed_cost_per_unit_unit || report.unit || 'kg'}):* *${col.landed_cost_per_unit_display}*`,
          `• *Delivery Period:* ${col.delivery_period}`,
          `• *Payment Terms:* ${col.payment_terms}`,
          `• *Quotation Validity:* ${col.quote_validity}`,
          `• *Quality Documents Offered:* ${col.quality_docs}`,
          `• *RAKSHAK Verification Status:* *${col.rakshak_status}* (${eligibilityTag})`,
          ``
        );
      });
    } else {
      lines.push(`_No submitted quotations found._\n`);
    }

    // Pending suppliers section (names and status without selection controls)
    if (pendingCols.length > 0) {
      lines.push(`⏳ *QUOTATIONS PENDING (${pendingCols.length} Awaiting Response)*`);
      pendingCols.forEach(p => {
        lines.push(`• *${p.supplier_name}* (${p.location || 'Invited'}) — *Quotation pending* (Cannot be selected)`);
      });
      lines.push(``);
    }

    lines.push(
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `_Select any eligible supplier below to configure approved quantity and purchase terms:_`
    );

    // Build neutral selection buttons for EVERY supplier who submitted a quotation
    const buttons = [];

    submittedCols.forEach(col => {
      const shortName = col.supplier_name.split(" ")[0];
      buttons.push({
        id: `btn_po_select_${col.supplier_id}`,
        text: `Select: ${shortName}`
      });
    });

    buttons.push({
      id: "btn_preview_comparison_doc",
      text: "📄 View Comparison Report (T-2) PDF"
    });

    return {
      sender: "purechain",
      text: lines.join("\n"),
      buttons: buttons,
      step: "PO_SELECT_SUPPLIER"
    };
  }

  handlePoSupplierSelection(supplierId, textInput) {
    const s = this.buyer_state;
    const rfqRef = s.po_rfq_ref || s.rfq_ref || "PC-RFQ-2026-0113";
    const report = PROCUREMENT_DATA.shared_store.current_comparison || PROCUREMENT_DATA.generateComparativeStatement(rfqRef);

    let targetSuppId = supplierId;
    if (!targetSuppId && textInput) {
      const match = report.columns.find(c =>
        c.supplier_name.toLowerCase().includes(textInput.toLowerCase()) ||
        c.supplier_id.toLowerCase() === textInput.toLowerCase()
      );
      if (match) targetSuppId = match.supplier_id;
    }

    const targetCol = report.columns.find(c => c.supplier_id === targetSuppId);
    if (!targetCol) {
      const submittedCols = report.columns.filter(c => c.status === "SUBMITTED");
      return {
        sender: "purechain",
        text: `⚠️ Supplier not recognized. Please select one of the suppliers who submitted a quotation:`,
        buttons: [
          ...submittedCols.map(c => ({
            id: `btn_po_select_${c.supplier_id}`,
            text: `Select: ${c.supplier_name.split(' ')[0]}`
          })),
          { id: "btn_preview_comparison_doc", text: "📄 View Comparison Report (T-2) PDF" }
        ],
        step: "PO_SELECT_SUPPLIER"
      };
    }

    // 1. Pending suppliers who have not submitted a quotation remain non-selectable
    if (targetCol.status === "PENDING" || !targetCol.quotation) {
      const submittedCols = report.columns.filter(c => c.status === "SUBMITTED");
      return {
        sender: "purechain",
        text: `⏳ *Cannot Select Pending Supplier*\n\nSupplier *${targetCol.supplier_name}* has not submitted a commercial quotation yet (*Quotation pending*).\n\nUnder MSME procurement governance, Purchase Orders can only be awarded against submitted and evaluated quotations.\n\nPlease select one of the suppliers who submitted a quotation:`,
        buttons: [
          ...submittedCols.map(c => ({
            id: `btn_po_select_${c.supplier_id}`,
            text: `Select: ${c.supplier_name.split(' ')[0]}`
          })),
          { id: "btn_preview_comparison_doc", text: "📄 View Comparison Report (T-2) PDF" }
        ],
        step: "PO_SELECT_SUPPLIER"
      };
    }

    // 2. Core Business Rule: The final supplier selection is entirely the buyer's decision!
    // Every supplier who submitted a quotation is selectable. RAKSHAK status is information
    // and compliance warnings are displayed, but the system never blocks or overwrites the buyer's choice.
    s.po_selected_supplier_id = targetSuppId;
    s.step = "PO_CONFIRM_QUANTITY";
    this.state.step = "PO_CONFIRM_QUANTITY";

    return this.renderPoQuantityPrompt(s, targetCol, report);
  }

  renderPoQuantityPrompt(s, col, report) {
    const rfq = PROCUREMENT_DATA.shared_store.current_rfq || {};
    const qty = s.po_quantity || s.quantity || 50.0;
    const unit = s.po_unit || s.unit || "MT";
    const delLoc = rfq.delivery_location || s.delivery_location || (s.terms && s.terms.term_2) || "Not specified";

    let complianceWarning = "";
    if (col.is_rakshak_failed) {
      complianceWarning = `\n⚠️ *COMPLIANCE WARNING (STATUTORY RISK)*:\nSupplier *${col.supplier_name}* has statutory RAKSHAK status: *${col.rakshak_status}*. GSTR-2B ITC reconciliation may be impacted. Proceeding under buyer commercial authority.\n`;
    } else if (col.is_rakshak_unavailable || (!col.is_rakshak_verified && !col.is_rakshak_failed)) {
      complianceWarning = `\n⚠️ *COMPLIANCE WARNING (VERIFICATION PENDING/UNAVAILABLE)*:\nSupplier *${col.supplier_name}* has statutory RAKSHAK status: *${col.rakshak_status}*. Statutory verification has not been confirmed as 'Verified and active'. Buyer discretion exercised under organization procurement policy.\n`;
    } else {
      complianceWarning = `\n🟢 *STATUTORY VERIFICATION*:\nConfirmed *${col.rakshak_status}*.\n`;
    }

    const lines = [
      `📦 *PURCHASE ORDER (TEMPLATE T-3) — STEP 2: QUANTITY CONFIRMATION*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🏢 *Selected Vendor:* *${col.supplier_name}* (${col.location})`,
      `🎖️ *Commercial Ranking:* ${col.rank_code || col.rank_display}`,
      `💰 *Quoted Rate:* ${col.quoted_rate_display}`,
      `🚚 *Landed Cost per Unit:* *${col.landed_cost_per_unit_display}*`,
      `📍 *Delivery Destination:* ${delLoc}`,
      `⏱️ *Agreed Timeline:* ${col.delivery_period}`,
      complianceWarning,
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n`,
      `The RFQ requisition quantity is *${qty} ${unit}*.\n`,
      `• Confirm allocation of full *${qty} ${unit}*, or type a revised approved quantity (e.g., \`25 MT\` or \`50\`):\n`,
      `_Note: Buyer approval remains pending until digital authorization in the next review step._`
    ];

    return {
      sender: "purechain",
      text: lines.join("\n"),
      buttons: [
        { id: "btn_po_confirm_full_qty", text: `✅ Confirm Full Quantity (${qty} ${unit})` },
        { id: "btn_po_change_supplier", text: "↩️ Choose Another Supplier" },
        { id: "btn_preview_comparison_doc", text: "📄 View Comparison Report (T-2) PDF" }
      ],
      step: "PO_CONFIRM_QUANTITY"
    };
  }

  handlePoQuantityInput(actionId, textInput) {
    const s = this.buyer_state;
    const rfqRef = s.po_rfq_ref || s.rfq_ref || "PC-RFQ-2026-0113";
    const report = PROCUREMENT_DATA.shared_store.current_comparison || PROCUREMENT_DATA.generateComparativeStatement(rfqRef);
    const col = report.columns.find(c => c.supplier_id === s.po_selected_supplier_id);

    if (actionId === "btn_po_confirm_full_qty") {
      s.po_quantity = s.quantity || 50.0;
    } else if (textInput && textInput.trim()) {
      const match = textInput.match(/([0-9]+(\.[0-9]+)?)/);
      if (match) {
        s.po_quantity = parseFloat(match[1]);
      }
    }

    s.step = "PO_REVIEW";
    this.state.step = "PO_REVIEW";
    return this.renderPoReviewPrompt(s, col, report);
  }

  renderPoReviewPrompt(s, col, report) {
    const rfq = PROCUREMENT_DATA.shared_store.current_rfq || {};
    const qty = s.po_quantity || 50.0;
    const unit = s.po_unit || "MT";
    const currentYear = new Date().getFullYear();
    const poRef = `PC-PO-${currentYear}-${(s.po_rfq_ref || '0113').replace(/^PC-RFQ-\d{4}-/, '')}`;
    s.po_ref = poRef;
    const delLoc = rfq.delivery_location || s.delivery_location || (s.terms && s.terms.term_2) || "Not specified";
    const payTerms = col.payment_terms || (s.terms && s.terms.term_3) || "Not specified";
    const buyerSignatoryName = s.contact_name || PROCUREMENT_DATA.buyer.contact_name || "Procurement Desk";

    // Recalculate financial breakdown for approved quantity
    const quoteData = col.quotation || col;
    const norm = PROCUREMENT_DATA.normalizeQuotationRates(quoteData, qty, unit);

    const isFullRfqQty = (qty === (s.quantity || (rfq.quantity || 50.0)));
    const baseAmt = (isFullRfqQty && col.base_amount)
      ? col.base_amount
      : norm.base_amount;
    const gstRate = col.gst_rate !== undefined ? col.gst_rate : ((col.quotation && col.quotation.gst_rate) || 0);
    const gstAmt = (isFullRfqQty && col.gst_amount !== undefined)
      ? col.gst_amount
      : Math.round((baseAmt * gstRate) / 100);
    const freightAmt = col.freight_amount !== undefined ? col.freight_amount : ((col.quotation && col.quotation.freight_amount) || 0);
    const totalPoValue = (isFullRfqQty && col.total_landed_cost)
      ? col.total_landed_cost
      : (baseAmt + gstAmt + freightAmt);

    let complianceNotice = "";
    if (col.is_rakshak_failed) {
      complianceNotice = `⚠️ *Compliance Warning:* Statutory RAKSHAK status is *${col.rakshak_status}*. Proceeding under buyer commercial authority.\n`;
    } else if (col.is_rakshak_unavailable || (!col.is_rakshak_verified && !col.is_rakshak_failed)) {
      complianceNotice = `⚠️ *Compliance Warning:* Statutory RAKSHAK status is *${col.rakshak_status}* (verification pending/unavailable). Proceeding under buyer commercial authority.\n`;
    }

    s.buyer_approval_status = "PENDING";
    s.po_approval_status = "PENDING";
    s.step = "PO_REVIEW";
    this.state.step = "PO_REVIEW";

    const lines = [
      `🛒 *PURCHASE ORDER (TEMPLATE T-3) — REVIEW & APPROVAL*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🏷️ *PO Reference:* \`${poRef}\` (Draft)`,
      `📄 *Against RFQ:* \`${s.po_rfq_ref}\``,
      `📊 *Comparative Statement:* \`${s.po_comparison_ref}\``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🏢 *Buyer Organization:* ${PROCUREMENT_DATA.buyer.name}`,
      `👤 *Buyer Signatory:* *${buyerSignatoryName}*`,
      `🏭 *Selected Supplier:* *${col.supplier_name}* (${col.location})`,
      `📦 *Commodity:* ${rfq.material || "Onion"} (${rfq.technical_specs || "Standard"})`,
      `⚖️ *Approved Quantity:* *${qty} ${unit}*`,
      `💰 *Agreed Rate:* ${col.quoted_rate_display}`,
      `📑 *Base Subtotal:* INR ${baseAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      `🏛️ *GST (${col.gst_rate}%):* INR ${gstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      `🚚 *Freight Charges:* INR ${freightAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      `💵 *Total PO Value:* *INR ${totalPoValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}*`,
      `📍 *Delivery Destination:* ${delLoc}`,
      `💳 *Payment Terms:* ${payTerms}`,
      `⏱️ *Agreed Delivery Period:* ${col.delivery_period}`,
      complianceNotice ? `\n${complianceNotice}` : ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n`,
      `⚠️ *BUYER APPROVAL CONTROL:*`,
      `Approval Status: ⏳ *Pending buyer signature*`,
      `The Purchase Order has NOT been issued or dispatched. Click below to review and digitally sign:\n`
    ];

    return {
      sender: "purechain",
      text: lines.join("\n"),
      buttons: [
        { id: "btn_buyer_accept_sign_po", text: "✍️ Accept & Sign Purchase Order" },
        { id: "btn_preview_po_doc", text: "📄 View Purchase Order (T-3) PDF" },
        { id: "btn_po_change_supplier", text: "↩️ Change Supplier" },
        { id: "btn_preview_comparison_doc", text: "📄 View Comparison Report (T-2) PDF" }
      ],
      step: "PO_REVIEW"
    };
  }

  renderPoSignConfirmationPrompt(s, col, report) {
    s.step = "PO_SIGN_CONFIRM";
    this.state.step = "PO_SIGN_CONFIRM";
    const currentYear = new Date().getFullYear();
    const poRef = s.po_ref || `PC-PO-${currentYear}-${(s.po_rfq_ref || '0113').replace(/^PC-RFQ-\d{4}-/, '')}`;
    const buyerSignatoryName = s.contact_name || PROCUREMENT_DATA.buyer.contact_name || "Procurement Desk";

    return {
      sender: "purechain",
      text: `✍️ *CONFIRM PURCHASE ORDER SIGN-OFF & DISPATCH*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `You are signing Purchase Order \`${poRef}\` as *${buyerSignatoryName}*.\n\n` +
            `Once you confirm, the signed Purchase Order will be sent to *${col.supplier_name}* for acceptance.\n`,
      buttons: [
        { id: "btn_buyer_confirm_send_supplier", text: "Confirm & Send to Supplier" },
        { id: "btn_buyer_cancel_sign", text: "Cancel" },
        { id: "btn_preview_po_doc", text: "📄 View Purchase Order (T-3) PDF" }
      ],
      step: "PO_SIGN_CONFIRM"
    };
  }

  getOrCreateDraftPo() {
    const s = this.buyer_state;
    if (!s) return null;
    const rfqRef = s.po_rfq_ref || s.rfq_ref || "PC-RFQ-2026-0113";
    const report = PROCUREMENT_DATA.shared_store.current_comparison || PROCUREMENT_DATA.generateComparativeStatement(rfqRef);
    const col = (report && report.columns) ? report.columns.find(c => c.supplier_id === s.po_selected_supplier_id) : null;
    if (!col) return null;

    const qty = s.po_quantity || s.quantity || 50.0;
    const unit = s.po_unit || s.unit || "MT";
    const norm = PROCUREMENT_DATA.normalizeQuotationRates(col.quotation || col, qty, unit);
    const isFullRfqQty = (qty === (s.quantity || 50.0));
    const baseAmt = (isFullRfqQty && col.base_amount) ? col.base_amount : norm.base_amount;
    const gstRate = col.gst_rate || 0;
    const gstAmt = (isFullRfqQty && col.gst_amount !== undefined) ? col.gst_amount : Math.round((baseAmt * gstRate) / 100);
    const freightAmt = col.freight_amount || 0;
    const totalPoValue = (isFullRfqQty && col.total_landed_cost) ? col.total_landed_cost : (baseAmt + gstAmt + freightAmt);

    return PROCUREMENT_DATA.buildPoObject({
      po_ref: s.po_ref,
      supplier_id: col.supplier_id,
      supplier_name: col.supplier_name,
      supplier_location: col.location,
      quantity: qty,
      unit: unit,
      unit_price: norm.original_quoted_rate,
      unit_rate_val: norm.original_quoted_rate,
      unit_rate_unit: norm.original_quoted_unit,
      unit_price_display: col.quoted_rate_display,
      quoted_rate_display: col.quoted_rate_display,
      base_amount: baseAmt,
      freight_amount: freightAmt,
      freight_display: col.freight_display,
      gst_rate: gstRate,
      gst_amount: gstAmt,
      total_landed_amount: totalPoValue,
      quotation_ref: col.quotation ? col.quotation.quotation_ref : "QT-2026",
      quotation_date: col.quotation && col.quotation.submitted_at ? new Date(col.quotation.submitted_at).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
      delivery_timeline: col.delivery_period,
      payment_terms: col.payment_terms || (s.terms && s.terms.term_3) || "Not specified",
      delivery_address: s.delivery_location || (s.terms && s.terms.term_2) || "Not specified",
      quality_docs: col.quality_docs || (s.terms && s.terms.term_5) || "Not specified"
    });
  }

  executePoDispatch() {
    const s = this.buyer_state;
    const rfqRef = s.po_rfq_ref || s.rfq_ref || "PC-RFQ-2026-0113";
    const report = PROCUREMENT_DATA.shared_store.current_comparison || PROCUREMENT_DATA.generateComparativeStatement(rfqRef);
    const col = report.columns.find(c => c.supplier_id === s.po_selected_supplier_id);

    if (!col || col.status !== "SUBMITTED") {
      return {
        sender: "purechain",
        text: `⚠️ *PO DISPATCH ERROR*\n\nUnable to dispatch Purchase Order: Selected supplier has not submitted a valid commercial quotation. Please select a supplier who submitted a quotation.`,
        buttons: [
          { id: "btn_po_change_supplier", text: "↩️ Choose Another Supplier" },
          { id: "btn_preview_comparison_doc", text: "📄 View Comparison Report (T-2) PDF" }
        ],
        step: "PO_SELECT_SUPPLIER"
      };
    }

    const qty = s.po_quantity || s.quantity || 50.0;
    const unit = s.po_unit || s.unit || "MT";
    const norm = PROCUREMENT_DATA.normalizeQuotationRates(col.quotation || col, qty, unit);

    const isFullRfqQty = (qty === (s.quantity || 50.0));
    const baseAmt = (isFullRfqQty && col.base_amount)
      ? col.base_amount
      : norm.base_amount;
    const gstRate = col.gst_rate || 0;
    const gstAmt = (isFullRfqQty && col.gst_amount !== undefined)
      ? col.gst_amount
      : Math.round((baseAmt * gstRate) / 100);
    const freightAmt = col.freight_amount || 0;
    const totalPoValue = (isFullRfqQty && col.total_landed_cost)
      ? col.total_landed_cost
      : (baseAmt + gstAmt + freightAmt);

    let complianceWarning = null;
    if (col.is_rakshak_failed) {
      complianceWarning = `Failed statutory verification (${col.rakshak_status})`;
    } else if (col.is_rakshak_unavailable || (!col.is_rakshak_verified && !col.is_rakshak_failed)) {
      complianceWarning = `Verification pending/unavailable (${col.rakshak_status})`;
    }

    let po = null;
    try {
      po = PROCUREMENT_DATA.createPurchaseOrder({
        po_ref: s.po_ref, // Reuses existing po_ref if retry, preventing duplicate numbers
        supplier_id: col.supplier_id,
        supplier_name: col.supplier_name,
        supplier_location: col.location,
        quantity: qty,
        unit: unit,
        unit_price: norm.original_quoted_rate,
        unit_rate_val: norm.original_quoted_rate,
        unit_rate_unit: norm.original_quoted_unit,
        unit_price_display: col.quoted_rate_display,
        quoted_rate_display: col.quoted_rate_display,
        base_amount: baseAmt,
        freight_amount: freightAmt,
        freight_display: col.freight_display,
        gst_rate: gstRate,
        gst_amount: gstAmt,
        total_landed_amount: totalPoValue,
        quotation_ref: col.quotation ? col.quotation.quotation_ref : "QT-2026",
        quotation_date: col.quotation && col.quotation.submitted_at ? new Date(col.quotation.submitted_at).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
        delivery_timeline: col.delivery_period,
        payment_terms: col.payment_terms || (s.terms && s.terms.term_3) || "Not specified",
        delivery_address: s.delivery_location || (s.terms && s.terms.term_2) || "Not specified",
        quality_docs: col.quality_docs || (s.terms && s.terms.term_5) || "Not specified",
        compliance_warning: complianceWarning
      });

      // Record buyer sign-off & transition document to buyer_signed
      const buyerSignatoryName = s.contact_name || PROCUREMENT_DATA.buyer.contact_name || "Procurement Desk";
      po = PROCUREMENT_DATA.recordBuyerPoSignOff(po.po_ref, buyerSignatoryName);
    } catch (err) {
      return {
        sender: "purechain",
        text: `⚠️ *PO GENERATION ERROR*\n\nUnable to generate Purchase Order document: ${err.message}.\n\nApproved PO data has been preserved. Please retry below:`,
        buttons: [
          { id: "btn_buyer_confirm_send_supplier", text: "🔄 Retry Sign & Dispatch Purchase Order" },
          { id: "btn_po_change_supplier", text: "↩️ Choose Another Supplier" }
        ],
        step: "PO_REVIEW"
      };
    }

    if (!po || !po.document_html) {
      return {
        sender: "purechain",
        text: `⚠️ *DOCUMENT GENERATION ERROR*\n\nPurchase Order PDF could not be compiled. Approved PO data has been preserved. Please retry below:`,
        buttons: [
          { id: "btn_buyer_confirm_send_supplier", text: "🔄 Retry Sign & Dispatch Purchase Order" },
          { id: "btn_po_change_supplier", text: "↩️ Choose Another Supplier" }
        ],
        step: "PO_REVIEW"
      };
    }

    // Deliver PO card exclusively to the awarded supplier's chat history
    const awardedSupplierId = col.supplier_id;

    const supplierPoMsg = {
      sender: "purechain",
      text: `📄 *PURCHASE ORDER RECEIVED (OFFICIAL PURCHASE ORDER (TEMPLATE T-3) RECEIVED)*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🏷️ *PO Number:* \`${po.po_ref}\`\n` +
            `🏢 *Buyer Organization:* *${po.buyer.name}*\n` +
            `👤 *Buyer Signatory:* *${po.buyer_signatory_name}*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `📦 *Commodity:* ${po.line_items[0].item_name}\n` +
            `⚖️ *Approved Quantity:* *${po.line_items[0].quantity} ${po.line_items[0].unit}*\n` +
            `💰 *Agreed Rate:* ${po.line_items[0].unit_rate_display}\n` +
            `💵 *Total PO Value:* *INR ${po.total_order_value_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}*\n` +
            `📍 *Delivery Destination:* ${po.deliver_to.address}\n` +
            `⏱️ *Agreed Delivery Period:* ${po.delivery_timeline}\n` +
            `💳 *Payment Terms:* ${po.payment_terms}\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🟢 *Status:* *Issued & Digitally Signed by Buyer — Awaiting your acceptance.*\n\n` +
            `Please review the official Purchase Order (Template T-3) below and confirm your acceptance or decline:`,
      buttons: [
        { id: "btn_supp_accept_po", text: "✅ Accept Purchase Order" },
        { id: "btn_supp_decline_po", text: "❌ Decline Purchase Order" },
        { id: "btn_preview_po_doc", text: "📄 View Purchase Order (T-3) PDF" }
      ],
      step: "PO_RECEIVED"
    };

    // Prevent duplicate messages in supplier's chat history upon retry
    const existingHist = PROCUREMENT_DATA.shared_store.conversation_histories[awardedSupplierId] || [];
    const alreadyDelivered = existingHist.some(m => m.text && m.text.includes(po.po_ref));
    if (!alreadyDelivered) {
      this.recordMessage(awardedSupplierId, supplierPoMsg);
      PROCUREMENT_DATA.shared_store.unread_counts[awardedSupplierId] = (PROCUREMENT_DATA.shared_store.unread_counts[awardedSupplierId] || 0) + 1;
      PROCUREMENT_DATA.shared_store.last_snippets[awardedSupplierId] = `🎉 PO Received: ${po.po_ref}`;
    }

    // Shared store delivery audit
    PROCUREMENT_DATA.shared_store.po_delivery = {
      po_ref: po.po_ref,
      awarded_supplier_id: awardedSupplierId,
      delivered_at: new Date().toISOString(),
      status: "DELIVERED"
    };

    if (this.supplier_states && this.supplier_states[awardedSupplierId]) {
      this.supplier_states[awardedSupplierId].step = "PO_RECEIVED";
      this.supplier_states[awardedSupplierId].po_ref = po.po_ref;
    }

    this.updateSidebarUI();

    // Buyer state updates
    s.po_ref = po.po_ref;
    s.po_approval_status = "APPROVED";
    s.buyer_approval_status = "SIGNED";
    s.po_dispatched = true;
    s.step = "PO_DISPATCHED";
    this.state.step = "PO_DISPATCHED";
    PROCUREMENT_DATA.shared_store.last_snippets["buyer"] = `🎉 PO Issued: ${po.po_ref}`;

    return {
      sender: "purechain",
      text: `🎉 *PURCHASE ORDER (TEMPLATE T-3) DIGITALLY SIGNED & DISPATCHED*\n\n` +
            `• *PO Number:* \`${po.po_ref}\`\n` +
            `• *Awarded Supplier:* *${po.vendor.name}*\n` +
            `• *Buyer Signatory:* *${po.buyer_signatory_name}*\n` +
            `• *Total Order Value:* *INR ${po.total_order_value_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}*\n` +
            `• *Amount in Words:* _${po.amount_in_words}_\n` +
            `• *Delivery Destination:* ${po.deliver_to.address}\n` +
            `• *Status:* ⏳ *Sent to Supplier — Awaiting Acceptance*\n` +
            `• *Simulated Dispatch:* Delivered to *${po.vendor.name}*'s WhatsApp portal\n\n` +
            `The official Purchase Order (Template T-3) has been digitally signed and sent to *${po.vendor.name}*, awaiting supplier acceptance. Click below to view the signed PDF document or track execution milestones:`,
      buttons: [
        { id: "btn_preview_po_doc", text: "📄 View Purchase Order (T-3) PDF" },
        { id: "btn_buyer_check_po_status", text: "📊 Track Order Status & Milestones" },
        { id: "btn_preview_comparison_doc", text: "📄 View Comparison Report (T-2) PDF" }
      ],
      step: "PO_DISPATCHED"
    };
  }

  renderBuyerPoStatus() {
    const po = PROCUREMENT_DATA.shared_store.current_po;
    if (!po) {
      return {
        sender: "purechain",
        text: `ℹ️ *No Purchase Order issued yet.* Please complete supplier selection and dispatch.`,
        buttons: [
          { id: "btn_preview_comparison_doc", text: "📄 View Comparison Report (T-2) PDF" }
        ],
        step: "COMPARISON_GENERATED"
      };
    }

    const m0 = (po.milestones && po.milestones[0]) ? po.milestones[0] : null;
    const m1 = (po.milestones && po.milestones[1]) ? po.milestones[1] : null;

    let m0Status = `🟢 COMPLETED (${(m0 && m0.date) ? m0.date : po.date_display})`;
    let m1Status = "🟡 PENDING";
    if (m1 && m1.status === "COMPLETED") {
      m1Status = `🟢 COMPLETED (${m1.date || 'Accepted'})`;
    } else if (m1 && (m1.status === "CANCELLED" || m1.status === "DECLINED")) {
      m1Status = `🔴 DECLINED (${m1.date || 'Declined'})`;
    }

    const isAccepted = po.supplier_response_status === "ACCEPTED";
    const poButtonText = isAccepted ? "📄 View Mutually Accepted PO (T-3) PDF" : "📄 View Purchase Order (T-3) PDF";

    const lines = [
      `📊 *PURCHASE ORDER EXECUTION & MILESTONE TRACKER*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🏷️ *PO Reference:* \`${po.po_ref}\``,
      `🏭 *Awarded Vendor:* *${po.vendor.name}*`,
      `📦 *Commodity:* ${po.line_items[0].item_name}`,
      `⚖️ *Approved Quantity:* ${po.line_items[0].quantity} ${po.line_items[0].unit}`,
      `💰 *Total Order Value:* INR ${po.total_order_value_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      `📍 *Delivery Destination:* ${po.deliver_to.address}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n`,
      `📍 *EXECUTION MILESTONES:*\n`,
      `1️⃣ *PO Generated & Digitally Dispatched:* ${m0Status}`,
      `2️⃣ *Supplier Commercial Acceptance:* ${m1Status}`,
      `3️⃣ *Consignment Dispatched & E-Way Bill:* ⚪ PENDING`,
      `4️⃣ *Weighbridge Inward & QC at Destination:* ⚪ PENDING\n`,
      `_All actions and documents are permanently archived in the PureChain Procurement Store._`
    ];

    return {
      sender: "purechain",
      text: lines.join("\n"),
      buttons: [
        { id: "btn_preview_po_doc", text: poButtonText },
        { id: "btn_preview_comparison_doc", text: "📄 View Comparison Report (T-2) PDF" }
      ],
      step: "PO_STATUS"
    };
  }

  syncRfqStore() {
    const s = this.buyer_state;
    return PROCUREMENT_DATA.createRFQ({
      rfq_ref: s.rfq_ref,
      material: "Onion",
      quantity: s.quantity,
      unit: s.unit,
      technical_specs: s.technical_specs,
      delivery_location: s.terms.term_2 || s.delivery_location,
      quotation_deadline: s.quotation_deadline,
      quote_validity: s.quote_validity,
      payment_terms: s.terms.term_3 || s.payment_terms,
      delivery_required_by: s.delivery_required_by,
      terms_config: s.terms,
      buyer: {
        ...PROCUREMENT_DATA.buyer,
        gstin: s.gstin,
        contact_name: s.contact_name,
        contact_phone: s.contact_phone,
        contact_email: s.contact_email,
        is_demo_contact: s.is_demo_contact
      }
    });
  }

  renderTermQuestion1(s) {
    s.step = "TERM_1";
    this.state.step = "TERM_1";
    const editNotice = s.is_editing_term ? `\n\n_Current setting:_ *${s.terms.term_1 || 'Not specified'}*` : '';
    const buttons = [
      { id: "btn_t1_opt1", text: "Per-unit rate (GST/freight separate)" },
      { id: "btn_t1_opt2", text: "FOR destination" },
      { id: "btn_t1_opt3", text: "Ex-works" },
      { id: "btn_t1_skip", text: "⏭️ Skip for now" }
    ];
    if (s.is_editing_term) {
      buttons.push({ id: "btn_back_to_review", text: "↩️ Cancel & Back to Review" });
    }
    return {
      sender: "purechain",
      text: `💰 *Term 1 of 8: Price Basis*\n\nPlease select a suggested price basis or type your custom requirement:\n\n• *Per-unit rate with GST and freight separate*\n• *FOR destination*\n• *Ex-works*` + editNotice + `\n\n_Tap an option below, type custom instructions, or skip for now:_`,
      buttons: buttons,
      step: "TERM_1"
    };
  }

  renderTermQuestion2(s) {
    s.step = "TERM_2";
    this.state.step = "TERM_2";
    const editNotice = s.is_editing_term ? `\n\n_Current setting:_ *${s.terms.term_2 || 'Not specified'}*` : '';
    const buttons = [
      { id: "btn_t2_skip", text: "⏭️ Skip for now" }
    ];
    if (s.is_editing_term) {
      buttons.push({ id: "btn_back_to_review", text: "↩️ Cancel & Back to Review" });
    }
    return {
      sender: "purechain",
      text: `📍 *Term 2 of 8: Delivery Location*\n\nPlease enter the actual delivery location and PIN code where the consignment must be delivered.\n\n_(Note: Do not invent an address. Delivery destination is separate from registered office address)_` + editNotice + `\n\n_Please type the actual delivery address and PIN code below, or skip for now:_`,
      buttons: buttons,
      step: "TERM_2"
    };
  }

  renderTermQuestion3(s) {
    s.step = "TERM_3";
    this.state.step = "TERM_3";
    const editNotice = s.is_editing_term ? `\n\n_Current setting:_ *${s.terms.term_3 || 'Not specified'}*` : '';
    const buttons = [
      { id: "btn_t3_opt1", text: "100% after delivery" },
      { id: "btn_t3_opt2", text: "100% after receipt & acceptance" },
      { id: "btn_t3_opt3", text: "30% advance, 70% delivery" },
      { id: "btn_t3_opt4", text: "10% advance, balance acceptance" },
      { id: "btn_t3_skip", text: "⏭️ Skip for now" }
    ];
    if (s.is_editing_term) {
      buttons.push({ id: "btn_back_to_review", text: "↩️ Cancel & Back to Review" });
    }
    return {
      sender: "purechain",
      text: `💳 *Term 3 of 8: Payment Terms Offered*\n\nPlease select suggested payment terms or type your custom terms:\n\n• *100% after delivery*\n• *100% after receipt and acceptance*\n• *30% advance and 70% after delivery*\n• *10% advance and balance after acceptance*` + editNotice + `\n\n_Tap an option below, type custom payment terms, or skip for now:_`,
      buttons: buttons,
      step: "TERM_3"
    };
  }

  renderTermQuestion4(s) {
    s.step = "TERM_4";
    this.state.step = "TERM_4";
    const editNotice = s.is_editing_term ? `\n\n_Current setting:_ *${s.terms.term_4 || 'Not specified'}*` : '';
    const buttons = [
      { id: "btn_t4_opt1", text: "Active GSTIN & tax invoice mandatory" },
      { id: "btn_t4_opt2", text: "GST invoice and e-way bill required" },
      { id: "btn_t4_not_req", text: "Not required" },
      { id: "btn_t4_skip", text: "⏭️ Skip for now" }
    ];
    if (s.is_editing_term) {
      buttons.push({ id: "btn_back_to_review", text: "↩️ Cancel & Back to Review" });
    }
    return {
      sender: "purechain",
      text: `🧾 *Term 4 of 8: GST & Invoicing Requirements*\n\nPlease select your GST/invoicing requirement or type custom instructions:\n\n• *Active GSTIN and GST tax invoice mandatory*\n• *GST invoice and e-way bill required*\n• *Not required*` + editNotice + `\n\n_Tap an option below, type custom instructions, or skip for now:_`,
      buttons: buttons,
      step: "TERM_4"
    };
  }

  renderTermQuestion5(s) {
    s.step = "TERM_5";
    this.state.step = "TERM_5";
    const editNotice = s.is_editing_term ? `\n\n_Current setting:_ *${s.terms.term_5 || 'Not specified'}*` : '';
    const buttons = [
      { id: "btn_t5_opt1", text: "Certificate of Analysis" },
      { id: "btn_t5_opt2", text: "Manufacturer test certificate" },
      { id: "btn_t5_opt3", text: "Weighment slip" },
      { id: "btn_t5_opt4", text: "Quality certificate" },
      { id: "btn_t5_not_req", text: "Not required" },
      { id: "btn_t5_skip", text: "⏭️ Skip for now" }
    ];
    if (s.is_editing_term) {
      buttons.push({ id: "btn_back_to_review", text: "↩️ Cancel & Back to Review" });
    }
    return {
      sender: "purechain",
      text: `🔬 *Term 5 of 8: Quality Documents*\n\nPlease select required quality documents or type custom requirements:\n\n• *Certificate of Analysis*\n• *Manufacturer test certificate*\n• *Weighment slip*\n• *Quality certificate*\n• *Not required*` + editNotice + `\n\n_Tap an option below, type custom requirements, or skip for now:_`,
      buttons: buttons,
      step: "TERM_5"
    };
  }

  renderTermQuestion6(s) {
    s.step = "TERM_6";
    this.state.step = "TERM_6";
    const editNotice = s.is_editing_term ? `\n\n_Current setting:_ *${s.terms.term_6 || 'Not specified'}*` : '';
    const buttons = [
      { id: "btn_t6_yes", text: "Required" },
      { id: "btn_t6_no", text: "Not required" },
      { id: "btn_t6_skip", text: "⏭️ Skip for now" }
    ];
    if (s.is_editing_term) {
      buttons.push({ id: "btn_back_to_review", text: "↩️ Cancel & Back to Review" });
    }
    return {
      sender: "purechain",
      text: `🌱 *Term 6 of 8: Material Origin Declaration*\n\nIs a formal Material Origin Declaration required from suppliers for this consignment?\n\n• *Required*\n• *Not required*` + editNotice + `\n\n_Tap an option below, type custom instructions, or skip for now:_`,
      buttons: buttons,
      step: "TERM_6"
    };
  }

  renderTermQuestion7(s) {
    s.step = "TERM_7";
    this.state.step = "TERM_7";
    const editNotice = s.is_editing_term ? `\n\n_Current setting:_ *${s.terms.term_7 || 'Not specified'}*` : '';
    const buttons = [
      { id: "btn_t7_opt1", text: "WhatsApp reply" },
      { id: "btn_t7_opt2", text: "Official email with PDF" },
      { id: "btn_t7_opt3", text: "WhatsApp or email" },
      { id: "btn_t7_skip", text: "⏭️ Skip for now" }
    ];
    if (s.is_editing_term) {
      buttons.push({ id: "btn_back_to_review", text: "↩️ Cancel & Back to Review" });
    }
    return {
      sender: "purechain",
      text: `📩 *Term 7 of 8: Quotation Submission Method*\n\nPlease select quotation submission instructions or type custom instructions:\n\n• *WhatsApp reply*\n• *Official email with quotation PDF*\n• *WhatsApp or email*` + editNotice + `\n\n_Tap an option below, type custom instructions, or skip for now:_`,
      buttons: buttons,
      step: "TERM_7"
    };
  }

  renderTermQuestion8(s) {
    s.step = "TERM_8";
    this.state.step = "TERM_8";
    const editNotice = s.is_editing_term ? `\n\n_Current setting:_ *${s.terms.term_8 || 'Not specified'}*` : '';
    const buttons = [
      { id: "btn_t8_confirm", text: "✅ Confirm official clause" },
      { id: "btn_t8_not_req", text: "Not required" },
      { id: "btn_t8_skip", text: "⏭️ Skip for now" }
    ];
    if (s.is_editing_term) {
      buttons.push({ id: "btn_back_to_review", text: "↩️ Cancel & Back to Review" });
    }
    return {
      sender: "purechain",
      text: `⚖️ *Term 8 of 8: Right of Buyer*\n\nOfficial standard Template T-1 clause:\n\n_"Buyer reserves the right to accept any quote in whole or in part, reject any or all quotes without assigning reasons, and split quantities across multiple suppliers."_` + editNotice + `\n\n_Confirm this standard clause, select Not required, type custom text, or skip for now:_`,
      buttons: buttons,
      step: "TERM_8"
    };
  }

  renderEditTermsMenu() {
    const s = this.buyer_state;
    s.step = "EDIT_TERMS_MENU";
    this.state.step = "EDIT_TERMS_MENU";
    const t1 = s.terms.term_1 || "Not specified";
    const t2 = s.terms.term_2 || s.delivery_location || "Not specified";
    const t3 = s.terms.term_3 || s.payment_terms || "Not specified";
    const t4 = s.terms.term_4 || "Not specified";
    const t5 = s.terms.term_5 || "Not specified";
    const t6 = s.terms.term_6 || "Not specified";
    const t7 = s.terms.term_7 || "Not specified";
    const t8 = s.terms.term_8 || "Not specified";
    const cName = s.contact_name || "Procurement Desk";
    const cPhone = s.contact_phone || "+91 90000 00000 (Demo placeholder)";
    const cEmail = s.contact_email || "procurement@example.com";

    const text = `✏️ *Configure & Edit Commercial Terms & Contact (Template T-1)*\n\nSelect any field below to modify its setting:\n\n` +
      `👤 *Contact for Queries:* ${cName} • ${cPhone} • ${cEmail}\n` +
      `1️⃣ *Price Basis:* ${t1}\n` +
      `2️⃣ *Delivery Location:* ${t2}\n` +
      `3️⃣ *Payment Terms:* ${t3}\n` +
      `4️⃣ *GST & Invoicing:* ${t4}\n` +
      `5️⃣ *Quality Documents:* ${t5}\n` +
      `6️⃣ *Origin Declaration:* ${t6}\n` +
      `7️⃣ *How to Submit:* ${t7}\n` +
      `8️⃣ *Right of Buyer:* ${t8}\n\n` +
      `_Tap any button to update:_`;

    return {
      sender: "purechain",
      text: text,
      buttons: [
        { id: "btn_edit_buyer_contact", text: "👤 Contact for Queries" },
        { id: "btn_edit_t1", text: "1️⃣ Price Basis" },
        { id: "btn_edit_t2", text: "2️⃣ Delivery Location" },
        { id: "btn_edit_t3", text: "3️⃣ Payment Terms" },
        { id: "btn_edit_t4", text: "4️⃣ GST & Invoicing" },
        { id: "btn_edit_t5", text: "5️⃣ Quality Documents" },
        { id: "btn_edit_t6", text: "6️⃣ Origin Declaration" },
        { id: "btn_edit_t7", text: "7️⃣ Submission Method" },
        { id: "btn_edit_t8", text: "8️⃣ Right of Buyer" },
        { id: "btn_back_to_review", text: "↩️ Return to RFQ Review" }
      ],
      step: "EDIT_TERMS_MENU"
    };
  }

  renderEditContactPrompt(s, fieldToEdit = null) {
    s.step = "EDIT_CONTACT";
    this.state.step = "EDIT_CONTACT";
    s.editing_contact_field = fieldToEdit;

    const currentName = s.contact_name || "Procurement Desk";
    const currentPhone = s.contact_phone || "+91 90000 00000 (Demo placeholder)";
    const currentEmail = s.contact_email || "procurement@example.com";
    const demoNotice = s.is_demo_contact
      ? `\n\n⚠️ _Note: Current contact details are sample demonstration data for Apex Green Metals Pvt Ltd and not real company contact information._`
      : `\n\n✅ _Custom contact information configured._`;

    if (fieldToEdit === "name") {
      return {
        sender: "purechain",
        text: `👤 *Edit Contact Person Name*\n\n_Current setting:_ *${currentName}*\n\n_Please type the contact person's name below, or return to review:_`,
        buttons: [
          { id: "btn_contact_reset_demo", text: "🔄 Reset to Sample ('Procurement Desk')" },
          { id: "btn_back_to_review", text: "↩️ Cancel & Back to Review" }
        ],
        step: "EDIT_CONTACT"
      };
    }

    if (fieldToEdit === "phone") {
      return {
        sender: "purechain",
        text: `📱 *Edit Contact Mobile / WhatsApp Number*\n\n_Current setting:_ *${currentPhone}*\n\n_Please type the phone or WhatsApp number below, or return to review:_`,
        buttons: [
          { id: "btn_contact_reset_demo", text: "🔄 Reset to Sample (+91 90000 00000)" },
          { id: "btn_back_to_review", text: "↩️ Cancel & Back to Review" }
        ],
        step: "EDIT_CONTACT"
      };
    }

    if (fieldToEdit === "email") {
      return {
        sender: "purechain",
        text: `📧 *Edit Contact Email Address*\n\n_Current setting:_ *${currentEmail}*\n\n_Please type the official contact email address below, or return to review:_`,
        buttons: [
          { id: "btn_contact_reset_demo", text: "🔄 Reset to Sample (procurement@example.com)" },
          { id: "btn_back_to_review", text: "↩️ Cancel & Back to Review" }
        ],
        step: "EDIT_CONTACT"
      };
    }

    return {
      sender: "purechain",
      text: `👤 *Configure Buyer Contact for Queries (Template T-1)*` + demoNotice + `\n\n` +
        `• 👤 *Contact Person:* *${currentName}*\n` +
        `• 📱 *Mobile / WhatsApp:* *${currentPhone}*\n` +
        `• 📧 *Email:* *${currentEmail}*\n\n` +
        `_You can choose a field to update, reset to demo sample, or type new details in format "Name, Mobile, Email":_`,
      buttons: [
        { id: "btn_contact_edit_name", text: "👤 Edit Name" },
        { id: "btn_contact_edit_phone", text: "📱 Edit Mobile" },
        { id: "btn_contact_edit_email", text: "📧 Edit Email" },
        { id: "btn_contact_reset_demo", text: "🔄 Reset to Sample Data" },
        { id: "btn_back_to_review", text: "↩️ Return to RFQ Review" }
      ],
      step: "EDIT_CONTACT"
    };
  }

  renderBuyerRfqReview() {
    const s = this.buyer_state;
    s.step = "REVIEW_RFQ";
    this.state.step = "REVIEW_RFQ";
    const deadlineStatus = s.quotation_deadline ? s.quotation_deadline : "⚠️ _[Missing — must supply before dispatch]_";

    const contactName = s.contact_name || "Procurement Desk";
    const contactPhone = s.contact_phone || "+91 90000 00000 (Demo placeholder)";
    const contactEmail = s.contact_email || "procurement@example.com";
    const demoTag = s.is_demo_contact ? " _(Demo placeholder)_" : "";

    const t1 = s.terms.term_1 || "Not specified";
    const t2 = s.terms.term_2 || s.delivery_location || "Not specified";
    const t3 = s.terms.term_3 || s.payment_terms || "Not specified";
    const t4 = s.terms.term_4 || "Not specified";
    const t5 = s.terms.term_5 || "Not specified";
    const t6 = s.terms.term_6 || "Not specified";
    const t7 = s.terms.term_7 || "Not specified";
    const t8 = s.terms.term_8 || "Not specified";

    const lines = [
      `📑 *Complete RFQ Dossier Review (Template T-1)*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🏷️ *RFQ Reference:* \`${s.rfq_ref}\``,
      `🏢 *Buyer Organization:* Apex Green Metals Pvt Ltd`,
      `👤 *Contact for Queries:* ${contactName} • ${contactPhone} • ${contactEmail}${demoTag}`,
      `📦 *Commodity:* Onion (Fresh Red Onion)`,
      `⚖️ *Consignment Volume:* *${s.quantity} MT*`,
      `🔬 *Technical Standard:* Grade A Red Onion (45-60mm), Moisture < 14%`,
      `⏰ *Quotation Deadline:* ${deadlineStatus}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `📜 *CONFIGURED RFQ TERMS (T-1 Terms 1 to 8):*`,
      `1️⃣ *Price Basis:* ${t1}`,
      `2️⃣ *Delivery Location:* ${t2}`,
      `3️⃣ *Payment Terms:* ${t3}`,
      `4️⃣ *GST & Invoicing:* ${t4}`,
      `5️⃣ *Quality Documents:* ${t5}`,
      `6️⃣ *Origin Declaration:* ${t6}`,
      `7️⃣ *How to Submit:* ${t7}`,
      `8️⃣ *Right of Buyer:* ${t8}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `👥 *Invited Suppliers (3):* Test Supplier Pvt Ltd, UJJIVAN SMALL FINANCE BANK, Supplier Test\n`,
      `_Preview official T-1 document, configure contact details or terms, or dispatch to suppliers:_`
    ];

    return {
      sender: "purechain",
      text: lines.join("\n"),
      buttons: [
        { id: "btn_preview_rfq_doc", text: "📄 Preview RFQ Document" },
        { id: "btn_edit_buyer_contact", text: "👤 Edit Contact Details" },
        { id: "btn_edit_terms_menu", text: "✏️ Edit Commercial Terms" },
        { id: "btn_buyer_dispatch_rfq", text: "🚀 Confirm & Dispatch RFQ" }
      ],
      step: "REVIEW_RFQ"
    };
  }

  executeRfqDispatch() {
    const s = this.buyer_state;

    // Check duplicate dispatch
    if (PROCUREMENT_DATA.shared_store.rfq_dispatched) {
      return {
        sender: "purechain",
        text: `⚠️ *RFQ ${s.rfq_ref} has already been dispatched.*\n\nSuppliers have received the request. You can check quotation progress below:`,
        buttons: [
          { id: "btn_buyer_check_status", text: "📊 Check Quotation Status" }
        ],
        step: "DISPATCH_CONFIRMED"
      };
    }

    // Do not dispatch with fabricated or missing deadline
    if (!s.quotation_deadline || !s.quotation_deadline.trim()) {
      const now = new Date();
      const dPrompt = new Date(now.getTime() + 6 * 86400000);
      const deadlinePrompt = `${dPrompt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}, 15:00 IST`;

      s.step = "MISSING_DEADLINE";
      this.state.step = "MISSING_DEADLINE";

      return {
        sender: "purechain",
        text: `⚠️ *Cannot Dispatch: Quotation Deadline Missing*\n\nAn official RFQ requires an explicit quotation submission deadline. Please set the deadline date & time to proceed:`,
        buttons: [
          { id: "btn_buyer_deadline_dispatch_set", text: `Set Deadline: ${deadlinePrompt}` }
        ],
        step: "MISSING_DEADLINE"
      };
    }

    // Update RFQ in store before dispatching
    this.syncRfqStore();

    const rfq = PROCUREMENT_DATA.dispatchRFQ();
    s.step = "DISPATCH_CONFIRMED";
    this.state.step = "DISPATCH_CONFIRMED";

    // Broadcast incoming message to all 3 supplier conversation histories
    PROCUREMENT_DATA.suppliers.forEach(supp => {
      if (this.supplier_states[supp.id]) {
        this.supplier_states[supp.id].step = "RECEIVED";
      }
      const incomingMsg = this.renderSupplierIncomingRfqMessage(supp);
      this.recordMessage(supp.id, incomingMsg);
    });

    this.updateSidebarUI();

    // Verbatim format required by Section 5:
    const dispatchConfirmationText = `✅ RFQ ${rfq.rfq_ref} dispatched successfully.

📨 SUPPLIER DISPATCH SUMMARY

✅ Successfully sent: 3  
❌ Failed to send: 0

🟢 Status: Dispatched — awaiting supplier quotations.

Supplier details will be shared once they respond to your RFQ.

━━━━━━━━━━━━━━━━━━━━━━━━━
👉 *Next Steps in Simulation:*
Click on any of the **Supplier tabs** in the left sidebar (**Test Supplier**, **UJJIVAN BANK**, or **Supplier Test**) to view their incoming WhatsApp message and submit their quotation.`;

    return {
      sender: "purechain",
      text: dispatchConfirmationText,
      buttons: [
        { id: "btn_preview_rfq_doc", text: "📄 Preview RFQ Document" },
        { id: "btn_buyer_check_status", text: "📊 Check Quotation Status" }
      ],
      step: "DISPATCH_CONFIRMED"
    };
  }

  renderBuyerQuotationStatus() {
    const summary = PROCUREMENT_DATA.getBuyerSummary();

    if (!summary.has_rfq) {
      return {
        sender: "purechain",
        text: `📊 *Procurement Status*\n\nNo active RFQ has been created yet. Please create and dispatch an RFQ first.`,
        buttons: [
          { id: "btn_buyer_start_rfq", text: "📋 Create New RFQ" }
        ],
        step: "INIT"
      };
    }

    const lines = [
      `📊 *RFQ QUOTATION MONITOR: ${summary.rfq_ref}*`,
      `Commodity: *${summary.material}* (${summary.quantity} ${summary.unit})`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `• *Total Suppliers Invited:* ${summary.total_invited}`,
      `• *Quotations Received:* ${summary.total_received}`,
      `• *Quotations Pending:* ${summary.total_pending}`,
      `• *Quotations Rejected:* 0`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n`,
      `📋 *SUPPLIER SUBMISSION STATUS:*`
    ];

    // List received suppliers WITHOUT exposing full commercial quotes
    summary.received_list.forEach((r, idx) => {
      lines.push(`${idx + 1}️⃣ *${r.name}* (${r.location})`);
      lines.push(`   Status: ✅ *Quotation Received* • Ref: \`${r.quotation_ref}\``);
    });

    // List pending suppliers
    summary.pending_list.forEach((p, idx) => {
      const num = summary.received_list.length + idx + 1;
      lines.push(`${num}️⃣ *${p.name}* (${p.location})`);
      lines.push(`   Status: ⏳ *Quotation Pending* • Awaiting response`);
    });

    lines.push(`\n━━━━━━━━━━━━━━━━━━━━━━━━━`);

    const buttons = [];

    // Provide action: Generate Comparison Report when at least one quotation has been received
    if (summary.total_received >= 1) {
      buttons.push({ id: "btn_buyer_generate_comparison", text: "📊 Generate Comparison Report" });
      if (summary.is_complete) {
        lines.push(`🎉 *All 3 Quotations Received!*`);
        lines.push(`Click *Generate Comparison Report* to compile the official Template T-2 Comparative Statement.`);
      } else {
        lines.push(`💡 *${summary.total_received} of ${summary.total_invited} quotes received.* You can generate the comparison report now or wait for remaining suppliers.`);
      }
    } else {
      lines.push(`⏳ _Awaiting supplier bids. Switch to supplier tabs in the sidebar to simulate submitting quotations._`);
    }

    buttons.push({ id: "btn_buyer_check_status", text: "🔄 Refresh Status" });
    buttons.push({ id: "btn_preview_rfq_doc", text: "📄 Preview RFQ Document" });

    return {
      sender: "purechain",
      text: lines.join("\n"),
      buttons: buttons,
      step: "MONITOR_STATUS"
    };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SUPPLIER PARSING & CALCULATION HELPERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  parseUnitRate(input, rfqQuantity = 50, rfqUnit = "MT") {
    if (!input || typeof input !== "string") return null;
    const str = input.trim();
    if (!str) return null;

    // Detect unit: kg vs MT
    const isKg = /\b(kg|kilo|kilogram|kilograms)\b/i.test(str) || /\/\s*kg/i.test(str) || /per\s*kg/i.test(str);
    const isMt = /\b(mt|tonne|tonnes|metric\s*tonne|ton)\b/i.test(str) || /\/\s*(mt|tonne|ton)/i.test(str) || /per\s*(mt|tonne|ton)/i.test(str);

    // Extract first numeric value (supporting commas, decimals)
    const cleaned = str.replace(/[₹,Rs\.]/gi, " ").trim();
    const match = cleaned.match(/(\d+(?:\s\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)/);
    if (!match) return null;
    const num = parseFloat(match[1].replace(/\s/g, ""));
    if (isNaN(num) || num <= 0) return null;

    let unit = "MT";
    if (isKg) {
      unit = "kg";
    } else if (isMt) {
      unit = "MT";
    } else {
      // Natural inference: rate <= 500 is per kg for onion; > 500 is per MT
      unit = num <= 500 ? "kg" : "MT";
    }

    let qtyInQuotedUnit = rfqQuantity;
    if (unit === "kg") {
      qtyInQuotedUnit = rfqQuantity * 1000; // 50 MT = 50,000 kg
    }

    const baseAmount = Math.round(qtyInQuotedUnit * num);
    const ratePerKg = unit === "kg" ? num : (num / 1000);
    const ratePerMt = unit === "MT" ? num : (num * 1000);

    const display = `₹${num.toLocaleString('en-IN')} / ${unit}` +
      (unit === "kg" ? ` (₹${ratePerMt.toLocaleString('en-IN')} / MT)` : ` (₹${ratePerKg.toLocaleString('en-IN')} / kg)`);

    const calcStr = `${qtyInQuotedUnit.toLocaleString('en-IN')} ${unit} × ₹${num.toLocaleString('en-IN')}/${unit} = ₹${baseAmount.toLocaleString('en-IN')}`;

    return {
      raw_input: str,
      rate_val: num,
      unit: unit,
      qty_in_quoted_unit: qtyInQuotedUnit,
      base_amount: baseAmount,
      rate_per_kg: ratePerKg,
      rate_per_mt: ratePerMt,
      display: display,
      calc_str: calcStr
    };
  }

  parseGstRate(input) {
    if (!input || typeof input !== "string") return null;
    const str = input.toLowerCase().trim();
    if (!str) return null;

    if (str === "0" || str === "0%" || str.includes("exempt") || str === "nil" || str === "zero") {
      return { gst_rate: 0, display: "0% (Exempted)" };
    }

    const match = str.match(/(\d+(?:\.\d+)?)/);
    if (!match) return null;
    const rate = parseFloat(match[1]);
    if (isNaN(rate) || rate < 0 || rate > 100) return null;

    return {
      gst_rate: rate,
      display: `${rate}%`
    };
  }

  parseFreightCharges(input, rfqQuantity = 50) {
    if (!input || typeof input !== "string") return null;
    const str = input.toLowerCase().trim();
    if (!str) return null;

    if (str === "0" || str === "₹0" || str.includes("included") || str.includes("nil") || str.includes("free") || str === "zero") {
      return {
        freight_amount: 0,
        display: "₹0 (Freight included in rate)",
        is_per_mt: false
      };
    }

    const isPerMt = /\b(per\s*mt|per\s*tonne|\/\s*mt|\/\s*tonne)\b/i.test(input);
    const cleaned = input.replace(/[₹,Rs\.]/gi, " ").trim();
    const match = cleaned.match(/(\d+(?:\s\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)/);
    if (!match) return null;
    const num = parseFloat(match[1].replace(/\s/g, ""));
    if (isNaN(num) || num < 0) return null;

    if (isPerMt) {
      const totalFreight = Math.round(num * rfqQuantity);
      return {
        freight_amount: totalFreight,
        rate_per_mt: num,
        display: `₹${totalFreight.toLocaleString('en-IN')} (₹${num.toLocaleString('en-IN')}/MT × ${rfqQuantity} MT)`,
        is_per_mt: true
      };
    } else {
      const totalFreight = Math.round(num);
      return {
        freight_amount: totalFreight,
        display: `₹${totalFreight.toLocaleString('en-IN')} (Lump sum)`,
        is_per_mt: false
      };
    }
  }

  formatInrWords(num) {
    if (isNaN(num) || num <= 0) return "Zero Rupees";
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function inWords(n) {
      if (n === 0) return '';
      if (n < 20) return a[n] + ' ';
      if (n < 100) return b[Math.floor(n / 10)] + ' ' + inWords(n % 10);
      if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred ' + inWords(n % 100);
      if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + inWords(n % 1000);
      if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + inWords(n % 100000);
      return inWords(Math.floor(n / 10000000)) + 'Crore ' + inWords(n % 10000000);
    }
    return 'INR ' + inWords(Math.round(num)).trim() + ' Only';
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SUPPLIER 7-FIELD QUOTATION INTAKE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  renderSupplierFieldPrompt(supplierId, fieldNum, errorMsg = null) {
    const supp = PROCUREMENT_DATA.getSupplierById(supplierId);
    const suppState = this.supplier_states[supplierId];
    const rfq = PROCUREMENT_DATA.shared_store.current_rfq || {};
    const d = suppState.data;

    suppState.step = `QUOTE_FIELD_${fieldNum}`;
    this.state.step = `QUOTE_FIELD_${fieldNum}`;

    const fieldNames = [
      "Quoted unit rate",
      "GST rate",
      "Freight charges",
      "Delivery period",
      "Payment terms",
      "Quotation validity",
      "Quality documents offered"
    ];

    // Build quotation progress banner
    const progressLines = [`📋 *Quotation Progress — ${rfq.rfq_ref || 'PC-RFQ-2026-0113'}*`];
    progressLines.push(`🏢 *Supplier:* ${supp.name}`);
    progressLines.push(`\n⏳ *Pending Information:*`);

    for (let i = 1; i <= 7; i++) {
      let icon = "⏳";
      let valNotice = "";
      if (i === fieldNum) {
        icon = "👉";
      } else if (
        (i === 1 && d.unit_rate_display) ||
        (i === 2 && d.gst_display) ||
        (i === 3 && d.freight_display) ||
        (i === 4 && d.delivery_period) ||
        (i === 5 && d.payment_terms) ||
        (i === 6 && d.quotation_validity) ||
        (i === 7 && d.quality_docs)
      ) {
        icon = "✅";
      }

      if (i === 1 && d.unit_rate_display) valNotice = ` *(${d.unit_rate_display})*`;
      else if (i === 2 && d.gst_display) valNotice = ` *(${d.gst_display})*`;
      else if (i === 3 && d.freight_display) valNotice = ` *(${d.freight_display})*`;
      else if (i === 4 && d.delivery_period) valNotice = ` *(${d.delivery_period})*`;
      else if (i === 5 && d.payment_terms) valNotice = ` *(${d.payment_terms})*`;
      else if (i === 6 && d.quotation_validity) valNotice = ` *(${d.quotation_validity})*`;
      else if (i === 7 && d.quality_docs) valNotice = ` *(${d.quality_docs})*`;

      progressLines.push(`${icon} ${i}. ${fieldNames[i - 1]}${valNotice}`);
    }

    progressLines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━`);

    let fieldPromptText = "";
    let buttons = [];

    if (fieldNum === 1) {
      fieldPromptText = `💰 *Field 1 of 7: Quoted Unit Rate*\n\nPlease enter your quoted unit rate for *${rfq.material || 'Onion'}* (e.g. \`₹60 per kg\` or \`₹28,000 per MT\`).\nRequested Volume: *${rfq.quantity || 50} ${rfq.unit || 'MT'}*\n\n_Tap a suggested sample option below, or type your custom rate:_`;
      buttons = [
        { id: "btn_q_rate_opt1", text: "₹60 per kg" },
        { id: "btn_q_rate_opt2", text: "₹28,000 per MT" },
        { id: "btn_q_rate_opt3", text: "₹30,000 per MT" }
      ];
    } else if (fieldNum === 2) {
      fieldPromptText = `🏛️ *Field 2 of 7: GST Rate*\n\nPlease specify the applicable GST rate percentage for this consignment.\n\n⚠️ _Note: Do not assume zero GST unless explicitly specified as 0% or Exempted._\n\n_Tap an option below, or type custom GST rate (e.g. "GST 18%"):_`;
      buttons = [
        { id: "btn_q_gst_opt1", text: "GST 18%" },
        { id: "btn_q_gst_opt2", text: "GST 5%" },
        { id: "btn_q_gst_opt3", text: "GST 12%" },
        { id: "btn_q_gst_opt4", text: "0% (Exempted)" }
      ];
    } else if (fieldNum === 3) {
      fieldPromptText = `🚚 *Field 3 of 7: Freight Charges*\n\nPlease specify freight charges to delivery location: *${rfq.delivery_location || 'Buyer Destination'}*.\n\n⚠️ _Note: Do not assume zero freight unless explicitly specified as included/₹0._\n\n_Tap an option below, or type custom freight (e.g. "Freight charges ₹1,000" or "₹1,500 per MT"):_`;
      buttons = [
        { id: "btn_q_freight_opt1", text: "Freight charges ₹1,000" },
        { id: "btn_q_freight_opt2", text: "₹1,500 per MT" },
        { id: "btn_q_freight_opt3", text: "₹2,000 per MT" },
        { id: "btn_q_freight_opt4", text: "₹0 (Freight included in rate)" }
      ];
    } else if (fieldNum === 4) {
      fieldPromptText = `⏱️ *Field 4 of 7: Delivery Period*\n\nPlease specify your delivery lead time to destination (e.g. \`Delivery period 2 days\`, \`5 business days\`, \`7 days\`).\n\n_Tap an option below, or type custom delivery period:_`;
      buttons = [
        { id: "btn_q_deliv_opt1", text: "Delivery period 2 days" },
        { id: "btn_q_deliv_opt2", text: "5 business days" },
        { id: "btn_q_deliv_opt3", text: "7 business days" },
        { id: "btn_q_deliv_opt4", text: "10 calendar days" }
      ];
    } else if (fieldNum === 5) {
      fieldPromptText = `💳 *Field 5 of 7: Payment Terms*\n\nPlease specify your required commercial payment terms (e.g. \`50% payment before delivery and 50% after delivery\`, \`100% after delivery\`).\n\n_Tap an option below, or type custom payment terms:_`;
      buttons = [
        { id: "btn_q_pay_opt1", text: "50% payment before delivery and 50% after delivery" },
        { id: "btn_q_pay_opt2", text: "100% after delivery" },
        { id: "btn_q_pay_opt3", text: "30% advance, 70% delivery" },
        { id: "btn_q_pay_opt4", text: "100% on acceptance" }
      ];
    } else if (fieldNum === 6) {
      fieldPromptText = `⏳ *Field 6 of 7: Quotation Validity*\n\nPlease specify how long this quotation remains valid for acceptance (e.g. \`Quotation validity 3 days\`, \`15 days\`, \`30 days\`).\n\n_Tap an option below, or type custom validity:_`;
      buttons = [
        { id: "btn_q_valid_opt1", text: "Quotation validity 3 days" },
        { id: "btn_q_valid_opt2", text: "7 days" },
        { id: "btn_q_valid_opt3", text: "15 days" },
        { id: "btn_q_valid_opt4", text: "30 days" }
      ];
    } else if (fieldNum === 7) {
      fieldPromptText = `🔬 *Field 7 of 7: Quality Documents Offered*\n\nPlease specify which quality certificates or inspection reports will accompany the consignment (e.g. \`Certificate of Analysis & Test Certificate\`, \`No quality documents\`).\n\n_Tap an option below, or type custom documents:_`;
      buttons = [
        { id: "btn_q_docs_opt1", text: "Certificate of Analysis & Test Certificate" },
        { id: "btn_q_docs_opt2", text: "Manufacturer test certificate & weighment slip" },
        { id: "btn_q_docs_opt3", text: "Weighment slip only" },
        { id: "btn_q_docs_opt4", text: "No quality documents" }
      ];
    }

    if (suppState.editing_field) {
      buttons.push({ id: "btn_supp_cancel_edit", text: "↩️ Cancel & Return to Summary" });
    }

    const errPrefix = errorMsg ? `${errorMsg}\n\n` : "";

    return {
      sender: "purechain",
      text: `${progressLines.join("\n")}\n\n${errPrefix}${fieldPromptText}`,
      buttons: buttons,
      step: `QUOTE_FIELD_${fieldNum}`
    };
  }

  renderSupplierQuoteSummary(supplierId) {
    const supp = PROCUREMENT_DATA.getSupplierById(supplierId);
    const suppState = this.supplier_states[supplierId];
    const rfq = PROCUREMENT_DATA.shared_store.current_rfq || {};
    const d = suppState.data;

    suppState.step = "QUOTE_SUMMARY";
    this.state.step = "QUOTE_SUMMARY";

    // Recalculate transparent amounts
    const rfqQty = rfq.quantity || 50;
    let qtyInQuotedUnit = rfqQty;
    if (d.unit_rate_unit === "kg") {
      qtyInQuotedUnit = rfqQty * 1000;
    }
    d.base_amount = Math.round(qtyInQuotedUnit * (d.unit_rate_val || 0));
    d.gst_amount = Math.round(d.base_amount * (d.gst_rate || 0) / 100);
    d.total_landed_amount = d.base_amount + d.gst_amount + (d.freight_amount || 0);

    const words = this.formatInrWords(d.total_landed_amount);
    const qtyKgStr = (rfqQty * 1000).toLocaleString('en-IN') + ' kg';

    const lines = [
      `📋 *Quotation Summary — ${rfq.rfq_ref || 'PC-RFQ-2026-0113'}*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🏢 *Supplier Entity:* ${supp.name} (${supp.location})`,
      `📦 *Item:* ${rfq.material || 'Onion'} (Fresh Red Onion)`,
      `⚖️ *Quantity:* *${rfqQty} ${rfq.unit || 'MT'}* (${qtyKgStr})\n`,
      `• *Quoted Base Rate:* *${d.unit_rate_display}*`,
      `• *Base Amount:* *₹${d.base_amount.toLocaleString('en-IN')}* _(${qtyInQuotedUnit.toLocaleString('en-IN')} ${d.unit_rate_unit} × ₹${d.unit_rate_val.toLocaleString('en-IN')}/${d.unit_rate_unit} = ₹${d.base_amount.toLocaleString('en-IN')})_`,
      `• *GST Rate & Amount:* *${d.gst_display}* _(₹${d.gst_amount.toLocaleString('en-IN')})_`,
      `• *Freight Charges:* *${d.freight_display}*`,
      `• *Delivery Period:* *${d.delivery_period}*`,
      `• *Payment Terms:* *${d.payment_terms}*`,
      `• *Quote Validity:* *${d.quotation_validity}*`,
      `• *Quality Documents Offered:* *${d.quality_docs}*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `💰 *Total Landed Amount:* *₹${d.total_landed_amount.toLocaleString('en-IN')}*`,
      `_(${words})_`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n`,
      `*Are you sure you want to submit this quotation?*`
    ];

    return {
      sender: "purechain",
      text: lines.join("\n"),
      buttons: [
        { id: "btn_supp_confirm_submit", text: "✅ Yes, Submit" },
        { id: "btn_supp_edit_quote", text: "✏️ Edit quotation" },
        { id: "btn_preview_rfq_doc", text: "📄 Preview RFQ Document" }
      ],
      step: "QUOTE_SUMMARY"
    };
  }

  renderSupplierEditMenu(supplierId) {
    const supp = PROCUREMENT_DATA.getSupplierById(supplierId);
    const suppState = this.supplier_states[supplierId];
    const rfq = PROCUREMENT_DATA.shared_store.current_rfq || {};
    const d = suppState.data;

    suppState.step = "EDIT_QUOTE_MENU";
    this.state.step = "EDIT_QUOTE_MENU";

    const lines = [
      `✏️ *Edit Quotation Details — ${rfq.rfq_ref || 'PC-RFQ-2026-0113'}*`,
      `🏢 *Supplier:* ${supp.name}\n`,
      `Select any field below to modify its value:\n`,
      `1️⃣ *Unit Rate:* ${d.unit_rate_display || 'Not specified'}`,
      `2️⃣ *GST Rate:* ${d.gst_display || 'Not specified'}`,
      `3️⃣ *Freight:* ${d.freight_display || 'Not specified'}`,
      `4️⃣ *Delivery Period:* ${d.delivery_period || 'Not specified'}`,
      `5️⃣ *Payment Terms:* ${d.payment_terms || 'Not specified'}`,
      `6️⃣ *Validity:* ${d.quotation_validity || 'Not specified'}`,
      `7️⃣ *Quality Documents:* ${d.quality_docs || 'Not specified'}\n`,
      `_Tap any button to update:_`
    ];

    return {
      sender: "purechain",
      text: lines.join("\n"),
      buttons: [
        { id: "btn_edit_q1", text: "1️⃣ Unit Rate" },
        { id: "btn_edit_q2", text: "2️⃣ GST Rate" },
        { id: "btn_edit_q3", text: "3️⃣ Freight Charges" },
        { id: "btn_edit_q4", text: "4️⃣ Delivery Period" },
        { id: "btn_edit_q5", text: "5️⃣ Payment Terms" },
        { id: "btn_edit_q6", text: "6️⃣ Quotation Validity" },
        { id: "btn_edit_q7", text: "7️⃣ Quality Documents" },
        { id: "btn_supp_cancel_edit", text: "↩️ Return to Summary" }
      ],
      step: "EDIT_QUOTE_MENU"
    };
  }

  executeSupplierQuoteSubmission(supplierId) {
    const supp = PROCUREMENT_DATA.getSupplierById(supplierId);
    const suppState = this.supplier_states[supplierId];
    const rfq = PROCUREMENT_DATA.shared_store.current_rfq;
    const d = suppState.data;

    const suppNum = supplierId.replace("supplier_", "S");
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const quoteRef = `QT-2026-${suppNum}-${randNum}`;

    const submissionParams = {
      quotation_ref: quoteRef,
      revision: "Rev 0",
      unit_rate_val: d.unit_rate_val,
      unit_rate_unit: d.unit_rate_unit,
      unit_rate_display: d.unit_rate_display,
      base_amount: d.base_amount,
      calc_breakdown: d.calc_str,
      gst_rate: d.gst_rate,
      gst_amount: d.gst_amount,
      freight_amount: d.freight_amount,
      freight_display: d.freight_display,
      total_landed_amount: d.total_landed_amount,
      delivery_period: d.delivery_period,
      payment_terms: d.payment_terms,
      quotation_validity: d.quotation_validity,
      quality_docs: d.quality_docs
    };

    const result = PROCUREMENT_DATA.submitQuotation(supplierId, submissionParams);
    if (result.duplicate) {
      return {
        sender: "purechain",
        text: `⚠️ *Quotation Already Submitted*\n\nYou have already submitted quotation \`${result.quotation.quotation_ref}\` for this RFQ.`,
        buttons: [{ id: "btn_preview_rfq_doc", text: "📄 Preview RFQ Document" }],
        step: "SUBMITTED"
      };
    }

    const q = result.quotation;
    suppState.step = "SUBMITTED";
    this.state.step = "SUBMITTED";

    // RFQ quotation status is updated silently in shared store.
    // Buyer chat does NOT receive full quotation details.
    // Comparison report is NOT generated automatically.
    this.updateSidebarUI();

    // Return confirmation message to Supplier
    const rfqQty = rfq.quantity || 50;
    const qtyKgStr = (rfqQty * 1000).toLocaleString('en-IN') + ' kg';

    const lines = [
      `✅ *Quotation Submitted & Recorded*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🏷️ *RFQ No.:* \`${q.rfq_ref}\``,
      `📄 *Quote Reference:* \`${q.quotation_ref}\``,
      `🔢 *Revision Number:* ${q.revision}`,
      `📦 *Quoted Item & Quantity:* ${q.material} — ${rfqQty} ${rfq.unit || 'MT'} (${qtyKgStr})`,
      `💵 *Base Amount:* ₹${q.base_amount.toLocaleString('en-IN')} _(at ${q.unit_rate_display})_`,
      `🏛️ *GST:* ${q.gst_rate}% _(₹${q.gst_amount.toLocaleString('en-IN')})_`,
      `🚚 *Freight:* ₹${q.freight_amount.toLocaleString('en-IN')} _(${q.freight_display})_`,
      `💰 *Total Landed Amount:* *₹${q.total_landed_amount.toLocaleString('en-IN')}*`,
      `⏱️ *Delivery Period:* ${q.delivery_period}`,
      `💳 *Payment Terms:* ${q.payment_terms}`,
      `⏳ *Valid Until:* ${q.quotation_validity}`,
      `🔬 *Quality Documents:* ${q.quality_docs}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n`,
      `Your commercial quotation has been officially logged in the shared procurement store and transmitted to the buyer desk.\n`,
      `👉 *Next:* Switch back to the **Buyer (Apex Green Metals)** in the left sidebar to see the updated quotation status and review your bid.`
    ];

    return {
      sender: "purechain",
      text: lines.join("\n"),
      buttons: [
        { id: "btn_preview_rfq_doc", text: "📄 Preview RFQ Document" }
      ],
      step: "SUBMITTED"
    };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SUPPLIER CONVERSATION FLOW DISPATCHER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  handleSupplierAction(supplierId, actionId, textInput) {
    const supp = PROCUREMENT_DATA.getSupplierById(supplierId);
    const suppState = this.supplier_states[supplierId] || this.createInitialSupplierState(supplierId);
    this.supplier_states[supplierId] = suppState;
    const rfq = PROCUREMENT_DATA.shared_store.current_rfq;
    const d = suppState.data;

    // ─────────────────────────────────────────────────────────────
    // PO ACCEPTANCE & DECLINE WORKFLOW (Evaluated BEFORE Quotation Checks)
    // ─────────────────────────────────────────────────────────────
    if (actionId === "btn_supp_accept_po") {
      return this.executeSupplierPoAcceptance(supplierId);
    }

    if (actionId === "btn_supp_decline_po") {
      return this.renderSupplierPoDeclinePrompt(supplierId);
    }

    if (actionId === "btn_supp_confirm_decline_po") {
      return this.executeSupplierPoDecline(supplierId);
    }

    if (actionId === "btn_supp_cancel_decline_po") {
      return this.renderSupplierPoReceivedPrompt(supplierId);
    }

    if (actionId === "btn_preview_po_doc") {
      const po = PROCUREMENT_DATA.shared_store.current_po;
      if (typeof window !== "undefined" && window.documentModal) {
        window.documentModal.showReportPreview("PO_DOCUMENT", po);
      }
      return null;
    }

    // Check if already submitted
    const assign = PROCUREMENT_DATA.shared_store.supplier_assignments[supplierId];
    if (assign && assign.status === "SUBMITTED") {
      const q = assign.quotation;
      return {
        sender: "purechain",
        text: `⚠️ *Quotation Already Submitted*\n\nYou have already submitted quotation \`${q.quotation_ref}\` for RFQ \`${rfq.rfq_ref}\`.\n\n• Unit Rate: *${q.unit_rate_display || q.unit_price_display}*\n• GST: *${q.gst_rate}%*\n• Freight: *${q.freight_display}*\n• Total Landed: *₹${q.total_landed_amount ? q.total_landed_amount.toLocaleString('en-IN') : 'N/A'}*\n• Delivery Period: *${q.delivery_period || q.delivery_timeline}*\n• Validity: *${q.quotation_validity}*\n\nMultiple submissions are prevented in this simulation stage.`,
        buttons: [
          { id: "btn_preview_rfq_doc", text: "📄 Preview RFQ Document" }
        ],
        step: "SUBMITTED"
      };
    }

    // Modal Document Preview
    if (actionId === "btn_preview_rfq_doc") {
      if (typeof window !== "undefined" && window.documentModal) {
        window.documentModal.showReportPreview("RFQ_DOCUMENT", PROCUREMENT_DATA.shared_store.current_rfq);
      }
      return null;
    }

    // Fast Preset Shortcut (Backward compatibility & quick demo)
    if (actionId === "btn_quote_preset_a" || actionId === "btn_quote_preset_b") {
      const presets = PROCUREMENT_DATA.demo_quotes[supplierId] || PROCUREMENT_DATA.demo_quotes.supplier_1;
      const selectedPreset = (actionId === "btn_quote_preset_b") ? presets[1] : presets[0];

      const parsedRate = this.parseUnitRate(selectedPreset.unit_price_display, rfq.quantity, rfq.unit);
      const parsedGst = this.parseGstRate(String(selectedPreset.gst_rate_percent) + "%");
      const parsedFreight = this.parseFreightCharges(selectedPreset.freight_display, rfq.quantity);

      d.unit_rate_val = parsedRate.rate_val;
      d.unit_rate_unit = parsedRate.unit;
      d.unit_rate_display = parsedRate.display;
      d.qty_in_quoted_unit = parsedRate.qty_in_quoted_unit;
      d.base_amount = parsedRate.base_amount;
      d.calc_str = parsedRate.calc_str;
      d.gst_rate = parsedGst.gst_rate;
      d.gst_display = parsedGst.display;
      d.gst_amount = Math.round(d.base_amount * d.gst_rate / 100);
      d.freight_amount = parsedFreight.freight_amount;
      d.freight_display = parsedFreight.display;
      d.delivery_period = selectedPreset.delivery_timeline;
      d.payment_terms = "100% after delivery";
      d.quotation_validity = selectedPreset.quotation_validity;
      d.quality_docs = selectedPreset.remarks || "Certificate of Analysis & Test Certificate";

      return this.renderSupplierQuoteSummary(supplierId);
    }

    // Start Quotation Flow
    if (actionId === "btn_supp_start_quote" || suppState.step === "RECEIVED") {
      suppState.current_field = 1;
      return this.renderSupplierFieldPrompt(supplierId, 1);
    }

    // Field 1: Quoted Unit Rate
    if (suppState.step === "QUOTE_FIELD_1") {
      let val = null;
      if (actionId === "btn_q_rate_opt1") val = "₹60 per kg";
      else if (actionId === "btn_q_rate_opt2") val = "₹28,000 per MT";
      else if (actionId === "btn_q_rate_opt3") val = "₹30,000 per MT";
      else if (textInput && textInput.trim()) val = textInput.trim();

      if (!val) {
        return this.renderSupplierFieldPrompt(supplierId, 1);
      }

      const parsed = this.parseUnitRate(val, rfq.quantity, rfq.unit);
      if (!parsed) {
        return this.renderSupplierFieldPrompt(supplierId, 1, `⚠️ *Invalid Quoted Unit Rate:* "${val}"\nPlease provide a valid numeric unit rate and unit (e.g. \`₹60 per kg\` or \`₹28,000 per MT\`).`);
      }

      d.unit_rate_val = parsed.rate_val;
      d.unit_rate_unit = parsed.unit;
      d.unit_rate_display = parsed.display;
      d.qty_in_quoted_unit = parsed.qty_in_quoted_unit;
      d.base_amount = parsed.base_amount;
      d.rate_per_kg = parsed.rate_per_kg;
      d.rate_per_mt = parsed.rate_per_mt;
      d.calc_str = parsed.calc_str;

      if (suppState.editing_field === 1) {
        suppState.editing_field = null;
        return this.renderSupplierQuoteSummary(supplierId);
      }
      suppState.current_field = 2;
      return this.renderSupplierFieldPrompt(supplierId, 2);
    }

    // Field 2: GST Rate
    if (suppState.step === "QUOTE_FIELD_2") {
      let val = null;
      if (actionId === "btn_q_gst_opt1") val = "GST 18%";
      else if (actionId === "btn_q_gst_opt2") val = "GST 5%";
      else if (actionId === "btn_q_gst_opt3") val = "GST 12%";
      else if (actionId === "btn_q_gst_opt4") val = "0% (Exempted)";
      else if (textInput && textInput.trim()) val = textInput.trim();

      if (!val) {
        return this.renderSupplierFieldPrompt(supplierId, 2);
      }

      const parsed = this.parseGstRate(val);
      if (!parsed) {
        return this.renderSupplierFieldPrompt(supplierId, 2, `⚠️ *Invalid GST Rate:* "${val}"\nPlease provide a valid GST percentage (e.g. \`GST 18%\`, \`5%\`, or \`0% (Exempted)\`).\n_Do not assume zero GST unless explicitly specified._`);
      }

      d.gst_rate = parsed.gst_rate;
      d.gst_display = parsed.display;
      d.gst_amount = Math.round(d.base_amount * parsed.gst_rate / 100);

      if (suppState.editing_field === 2) {
        suppState.editing_field = null;
        return this.renderSupplierQuoteSummary(supplierId);
      }
      suppState.current_field = 3;
      return this.renderSupplierFieldPrompt(supplierId, 3);
    }

    // Field 3: Freight Charges
    if (suppState.step === "QUOTE_FIELD_3") {
      let val = null;
      if (actionId === "btn_q_freight_opt1") val = "Freight charges ₹1,000";
      else if (actionId === "btn_q_freight_opt2") val = "₹1,500 per MT";
      else if (actionId === "btn_q_freight_opt3") val = "₹2,000 per MT";
      else if (actionId === "btn_q_freight_opt4") val = "₹0 (Freight included in rate)";
      else if (textInput && textInput.trim()) val = textInput.trim();

      if (!val) {
        return this.renderSupplierFieldPrompt(supplierId, 3);
      }

      const parsed = this.parseFreightCharges(val, rfq.quantity);
      if (!parsed) {
        return this.renderSupplierFieldPrompt(supplierId, 3, `⚠️ *Invalid Freight Charges:* "${val}"\nPlease provide valid freight charges (e.g. \`Freight charges ₹1,000\`, \`₹1,500 per MT\`, or \`₹0\`).\n_Do not assume zero freight unless explicitly specified._`);
      }

      d.freight_amount = parsed.freight_amount;
      d.freight_display = parsed.display;

      if (suppState.editing_field === 3) {
        suppState.editing_field = null;
        return this.renderSupplierQuoteSummary(supplierId);
      }
      suppState.current_field = 4;
      return this.renderSupplierFieldPrompt(supplierId, 4);
    }

    // Field 4: Delivery Period
    if (suppState.step === "QUOTE_FIELD_4") {
      let val = null;
      if (actionId === "btn_q_deliv_opt1") val = "Delivery period 2 days";
      else if (actionId === "btn_q_deliv_opt2") val = "5 business days";
      else if (actionId === "btn_q_deliv_opt3") val = "7 business days";
      else if (actionId === "btn_q_deliv_opt4") val = "10 calendar days";
      else if (textInput && textInput.trim()) val = textInput.trim();

      if (!val) {
        return this.renderSupplierFieldPrompt(supplierId, 4);
      }

      d.delivery_period = val;

      if (suppState.editing_field === 4) {
        suppState.editing_field = null;
        return this.renderSupplierQuoteSummary(supplierId);
      }
      suppState.current_field = 5;
      return this.renderSupplierFieldPrompt(supplierId, 5);
    }

    // Field 5: Payment Terms
    if (suppState.step === "QUOTE_FIELD_5") {
      let val = null;
      if (actionId === "btn_q_pay_opt1") val = "50% payment before delivery and 50% after delivery";
      else if (actionId === "btn_q_pay_opt2") val = "100% after delivery";
      else if (actionId === "btn_q_pay_opt3") val = "30% advance, 70% delivery";
      else if (actionId === "btn_q_pay_opt4") val = "100% on acceptance";
      else if (textInput && textInput.trim()) val = textInput.trim();

      if (!val) {
        return this.renderSupplierFieldPrompt(supplierId, 5);
      }

      d.payment_terms = val;

      if (suppState.editing_field === 5) {
        suppState.editing_field = null;
        return this.renderSupplierQuoteSummary(supplierId);
      }
      suppState.current_field = 6;
      return this.renderSupplierFieldPrompt(supplierId, 6);
    }

    // Field 6: Quotation Validity
    if (suppState.step === "QUOTE_FIELD_6") {
      let val = null;
      if (actionId === "btn_q_valid_opt1") val = "Quotation validity 3 days";
      else if (actionId === "btn_q_valid_opt2") val = "7 days";
      else if (actionId === "btn_q_valid_opt3") val = "15 days";
      else if (actionId === "btn_q_valid_opt4") val = "30 days";
      else if (textInput && textInput.trim()) val = textInput.trim();

      if (!val) {
        return this.renderSupplierFieldPrompt(supplierId, 6);
      }

      d.quotation_validity = val;

      if (suppState.editing_field === 6) {
        suppState.editing_field = null;
        return this.renderSupplierQuoteSummary(supplierId);
      }
      suppState.current_field = 7;
      return this.renderSupplierFieldPrompt(supplierId, 7);
    }

    // Field 7: Quality Documents Offered
    if (suppState.step === "QUOTE_FIELD_7") {
      let val = null;
      if (actionId === "btn_q_docs_opt1") val = "Certificate of Analysis & Test Certificate";
      else if (actionId === "btn_q_docs_opt2") val = "Manufacturer test certificate & weighment slip";
      else if (actionId === "btn_q_docs_opt3") val = "Weighment slip only";
      else if (actionId === "btn_q_docs_opt4") val = "No quality documents";
      else if (textInput && textInput.trim()) val = textInput.trim();

      if (!val) {
        return this.renderSupplierFieldPrompt(supplierId, 7);
      }

      d.quality_docs = val;

      if (suppState.editing_field === 7) {
        suppState.editing_field = null;
      }

      return this.renderSupplierQuoteSummary(supplierId);
    }

    // Summary Actions
    if (actionId === "btn_supp_edit_quote") {
      return this.renderSupplierEditMenu(supplierId);
    }

    if (actionId === "btn_supp_cancel_edit") {
      suppState.editing_field = null;
      return this.renderSupplierQuoteSummary(supplierId);
    }

    // Edit Menu Field Selectors
    if (actionId && actionId.startsWith("btn_edit_q")) {
      const fieldNum = parseInt(actionId.replace("btn_edit_q", ""), 10);
      if (fieldNum >= 1 && fieldNum <= 7) {
        suppState.editing_field = fieldNum;
        return this.renderSupplierFieldPrompt(supplierId, fieldNum);
      }
    }

    // Confirm & Submit Quotation
    if (actionId === "btn_supp_confirm_submit") {
      return this.executeSupplierQuoteSubmission(supplierId);
    }

    return null;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SUPPLIER PO ACCEPTANCE & DECLINE HANDLERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  executeSupplierPoAcceptance(supplierId) {
    const po = PROCUREMENT_DATA.shared_store.current_po;
    if (!po) {
      return {
        sender: "purechain",
        text: `⚠️ *No active Purchase Order found for acceptance.*`,
        step: "PO_ERROR"
      };
    }

    if (po.vendor && po.vendor.id !== supplierId) {
      return {
        sender: "purechain",
        text: `⚠️ *Unauthorized:* This Purchase Order was not awarded to your organization.`,
        step: "PO_UNAUTHORIZED"
      };
    }

    if (po.supplier_response_status === "ACCEPTED") {
      return {
        sender: "purechain",
        text: `⚠️ *Already Accepted*\n\nYou have already accepted Purchase Order \`${po.po_ref}\` on ${po.supplier_response_date}.`,
        buttons: [
          { id: "btn_preview_po_doc", text: "📄 View Mutually Accepted PO (T-3) PDF" }
        ],
        step: "PO_ACCEPTED"
      };
    }

    if (po.supplier_response_status === "DECLINED") {
      return {
        sender: "purechain",
        text: `⚠️ *Purchase Order Already Declined*\n\nThis Purchase Order \`${po.po_ref}\` was previously declined and cannot be accepted.`,
        buttons: [
          { id: "btn_preview_po_doc", text: "📄 View Purchase Order (T-3) PDF" }
        ],
        step: "PO_DECLINED"
      };
    }

    const supp = PROCUREMENT_DATA.getSupplierById(supplierId) || po.vendor;
    const suppSignatory = supp.contact_name || (po.vendor && po.vendor.contact_name) || (supp.name + " Authorized Signatory");

    PROCUREMENT_DATA.recordSupplierPoAcceptance(po.po_ref, supplierId, suppSignatory);

    const suppState = this.supplier_states[supplierId];
    if (suppState) {
      suppState.step = "PO_ACCEPTED";
      suppState.po_accepted = true;
    }

    // Deliver notification into buyer's WhatsApp chat
    const buyerAcceptNotice = {
      sender: "purechain",
      text: `✅ *SUPPLIER ACCEPTED PURCHASE ORDER*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🏷️ *PO Number:* \`${po.po_ref}\`\n` +
            `🏭 *Supplier:* *${po.vendor.name}*\n` +
            `👤 *Supplier Signatory:* *${po.supplier_signatory_name}*\n` +
            `🕒 *Accepted At:* ${po.supplier_response_date}\n` +
            `🟢 *Order Status:* *Mutually Accepted by Both Parties*\n\n` +
            `Both parties have digitally signed Purchase Order \`${po.po_ref}\`. The mutually accepted contract is now active. Click below to view the finalized two-party signed document:`,
      buttons: [
        { id: "btn_preview_po_doc", text: "📄 View Mutually Accepted PO (T-3) PDF" },
        { id: "btn_buyer_check_po_status", text: "📊 Track Order Status & Milestones" }
      ],
      step: "PO_ACCEPTED"
    };

    this.recordMessage("buyer", buyerAcceptNotice);
    PROCUREMENT_DATA.shared_store.unread_counts["buyer"] = (PROCUREMENT_DATA.shared_store.unread_counts["buyer"] || 0) + 1;
    PROCUREMENT_DATA.shared_store.last_snippets["buyer"] = `✅ PO Accepted: ${po.po_ref}`;
    this.updateSidebarUI();

    return {
      sender: "purechain",
      text: `✅ *PURCHASE ORDER ACCEPTED*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🏷️ *Purchase Order No:* \`${po.po_ref}\`\n` +
            `👤 *Supplier Signatory:* *${po.supplier_signatory_name}*\n` +
            `🏢 *Buyer Organization:* ${po.buyer.name}\n` +
            `🕒 *Acceptance Timestamp:* ${po.supplier_response_date}\n` +
            `🟢 *Status:* *Mutually Accepted by Both Parties*\n\n` +
            `You have officially accepted Purchase Order \`${po.po_ref}\`. A copy of the mutually signed agreement has been recorded and transmitted to the buyer.`,
      buttons: [
        { id: "btn_preview_po_doc", text: "📄 View Mutually Accepted PO (T-3) PDF" }
      ],
      step: "PO_ACCEPTED"
    };
  }

  renderSupplierPoDeclinePrompt(supplierId) {
    const po = PROCUREMENT_DATA.shared_store.current_po;
    if (!po) {
      return {
        sender: "purechain",
        text: `⚠️ *No active Purchase Order found.*`,
        step: "PO_ERROR"
      };
    }

    if (po.vendor && po.vendor.id !== supplierId) {
      return {
        sender: "purechain",
        text: `⚠️ *Unauthorized:* This Purchase Order was not awarded to your organization.`,
        step: "PO_UNAUTHORIZED"
      };
    }

    if (po.supplier_response_status === "ACCEPTED") {
      return {
        sender: "purechain",
        text: `⚠️ *Cannot Decline*\n\nPurchase Order \`${po.po_ref}\` has already been accepted and cannot be declined.`,
        buttons: [
          { id: "btn_preview_po_doc", text: "📄 View Mutually Accepted PO (T-3) PDF" }
        ],
        step: "PO_ACCEPTED"
      };
    }

    if (po.supplier_response_status === "DECLINED") {
      return {
        sender: "purechain",
        text: `⚠️ *Already Declined*\n\nYou have already declined Purchase Order \`${po.po_ref}\`.`,
        buttons: [
          { id: "btn_preview_po_doc", text: "📄 View Purchase Order (T-3) PDF" }
        ],
        step: "PO_DECLINED"
      };
    }

    const suppState = this.supplier_states[supplierId];
    if (suppState) suppState.step = "PO_DECLINE_CONFIRM";

    return {
      sender: "purechain",
      text: `⚠️ *CONFIRM DECLINING PURCHASE ORDER*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Are you sure you want to decline Purchase Order *${po.po_ref}*?\n\n` +
            `Once confirmed, the buyer will be notified that your organization declined the order.`,
      buttons: [
        { id: "btn_supp_confirm_decline_po", text: "Confirm Decline" },
        { id: "btn_supp_cancel_decline_po", text: "Cancel" },
        { id: "btn_preview_po_doc", text: "📄 View Purchase Order (T-3) PDF" }
      ],
      step: "PO_DECLINE_CONFIRM"
    };
  }

  executeSupplierPoDecline(supplierId) {
    const po = PROCUREMENT_DATA.shared_store.current_po;
    if (!po) {
      return {
        sender: "purechain",
        text: `⚠️ *No active Purchase Order found to decline.*`,
        step: "PO_ERROR"
      };
    }

    if (po.vendor && po.vendor.id !== supplierId) {
      return {
        sender: "purechain",
        text: `⚠️ *Unauthorized:* This Purchase Order was not awarded to your organization.`,
        step: "PO_UNAUTHORIZED"
      };
    }

    if (po.supplier_response_status === "ACCEPTED") {
      return {
        sender: "purechain",
        text: `⚠️ *Cannot Decline*\n\nPurchase Order \`${po.po_ref}\` was already accepted.`,
        buttons: [
          { id: "btn_preview_po_doc", text: "📄 View Mutually Accepted PO (T-3) PDF" }
        ],
        step: "PO_ACCEPTED"
      };
    }

    if (po.supplier_response_status === "DECLINED") {
      return {
        sender: "purechain",
        text: `⚠️ *Already Declined*\n\nYou have already declined Purchase Order \`${po.po_ref}\`.`,
        buttons: [
          { id: "btn_preview_po_doc", text: "📄 View Purchase Order (T-3) PDF" }
        ],
        step: "PO_DECLINED"
      };
    }

    PROCUREMENT_DATA.recordSupplierPoDecline(po.po_ref, supplierId);

    const suppState = this.supplier_states[supplierId];
    if (suppState) {
      suppState.step = "PO_DECLINED";
      suppState.po_declined = true;
    }

    // Deliver decline notice into buyer's WhatsApp chat
    const buyerDeclineNotice = {
      sender: "purechain",
      text: `❌ *SUPPLIER DECLINED PURCHASE ORDER*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🏷️ *PO Number:* \`${po.po_ref}\`\n` +
            `🏭 *Supplier:* *${po.vendor.name}*\n` +
            `🕒 *Declined At:* ${po.supplier_response_date}\n` +
            `⚠️ *Order Status:* *Declined by Supplier*\n\n` +
            `*${po.vendor.name}* has declined Purchase Order \`${po.po_ref}\`.\n` +
            `You may choose another supplier from the comparison report or issue a revised inquiry.`,
      buttons: [
        { id: "btn_po_change_supplier", text: "↩️ Select Another Supplier" },
        { id: "btn_preview_comparison_doc", text: "📄 View Comparison Report (T-2) PDF" },
        { id: "btn_preview_po_doc", text: "📄 View Declined PO (T-3) PDF" }
      ],
      step: "PO_DECLINED"
    };

    this.recordMessage("buyer", buyerDeclineNotice);
    PROCUREMENT_DATA.shared_store.unread_counts["buyer"] = (PROCUREMENT_DATA.shared_store.unread_counts["buyer"] || 0) + 1;
    PROCUREMENT_DATA.shared_store.last_snippets["buyer"] = `❌ PO Declined: ${po.po_ref}`;
    this.updateSidebarUI();

    return {
      sender: "purechain",
      text: `❌ *PURCHASE ORDER DECLINED*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🏷️ *Purchase Order No:* \`${po.po_ref}\`\n` +
            `🏢 *Buyer Organization:* ${po.buyer.name}\n` +
            `🕒 *Declined At:* ${po.supplier_response_date}\n` +
            `Status: *Declined by Supplier*\n\n` +
            `You have declined Purchase Order \`${po.po_ref}\`. The buyer has been notified.`,
      buttons: [
        { id: "btn_preview_po_doc", text: "📄 View Purchase Order (T-3) PDF" }
      ],
      step: "PO_DECLINED"
    };
  }

  renderSupplierPoReceivedPrompt(supplierId) {
    const po = PROCUREMENT_DATA.shared_store.current_po;
    const suppState = this.supplier_states[supplierId];
    if (suppState) suppState.step = "PO_RECEIVED";

    return {
      sender: "purechain",
      text: `📄 *PURCHASE ORDER RECEIVED (OFFICIAL PURCHASE ORDER (TEMPLATE T-3) RECEIVED)*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🏷️ *PO Number:* \`${po.po_ref}\`\n` +
            `🏢 *Buyer Organization:* *${po.buyer.name}*\n` +
            `👤 *Buyer Signatory:* *${po.buyer_signatory_name}*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `📦 *Commodity:* ${po.line_items[0].item_name}\n` +
            `⚖️ *Approved Quantity:* *${po.line_items[0].quantity} ${po.line_items[0].unit}*\n` +
            `💰 *Agreed Rate:* ${po.line_items[0].unit_rate_display}\n` +
            `💵 *Total PO Value:* *INR ${po.total_order_value_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}*\n` +
            `📍 *Delivery Destination:* ${po.deliver_to.address}\n` +
            `⏱️ *Agreed Delivery Period:* ${po.delivery_timeline}\n` +
            `💳 *Payment Terms:* ${po.payment_terms}\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🟢 *Status:* *Issued & Digitally Signed by Buyer — Awaiting your acceptance.*\n\n` +
            `Please review the official Purchase Order (Template T-3) below and confirm your acceptance or decline:`,
      buttons: [
        { id: "btn_supp_accept_po", text: "✅ Accept Purchase Order" },
        { id: "btn_supp_decline_po", text: "❌ Decline Purchase Order" },
        { id: "btn_preview_po_doc", text: "📄 View Purchase Order (T-3) PDF" }
      ],
      step: "PO_RECEIVED"
    };
  }
}

window.ProcurementEngine = ProcurementEngine;
if (typeof module !== "undefined" && module.exports) {
  module.exports = ProcurementEngine;
}

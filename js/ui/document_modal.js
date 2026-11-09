/**
 * Purechain AI — Document Modal & Report Viewer
 * Handles interactive document upload dialogs and statutory PDF/DOCX report previews.
 * Clean, client-facing presentation with zero internal agent names.
 */

class DocumentModal {
  constructor(app) {
    this.app = app;
    this.modalEl = document.getElementById("documentModal");
    this.modalTitle = document.getElementById("modalTitle");
    this.modalBody = document.getElementById("modalBody");
    this.closeBtn = document.getElementById("modalCloseBtn");

    if (this.closeBtn) {
      this.closeBtn.addEventListener("click", () => this.close());
    }

    // Close on backdrop click
    if (this.modalEl) {
      this.modalEl.addEventListener("click", (e) => {
        if (e.target === this.modalEl) this.close();
      });
    }
  }

  open(title, contentHtml) {
    this.modalTitle.innerText = title;
    this.modalBody.innerHTML = contentHtml;
    this.modalEl.classList.remove("hidden");
    document.body.classList.add("modal-open");
  }

  close() {
    this.modalEl.classList.add("hidden");
    document.body.classList.remove("modal-open");
  }

  showUploadDialog(workflow, onSelected) {
    const docs = window.SAMPLE_DOCS.filter(d => !workflow || d.workflow === workflow || d.workflow === "ALL");
    
    let docsListHtml = docs.map(d => `
      <div class="sample-doc-card" onclick="window.documentModal.selectDoc('${d.id}')">
        <div class="doc-icon">${d.icon}</div>
        <div class="doc-info">
          <div class="doc-name">${d.name}</div>
          <div class="doc-details">${d.type} • ${d.size} • ${d.doc_category} • Confidence: <strong>${d.extracted_data.confidence}</strong></div>
        </div>
        <button class="btn-select-doc">Select</button>
      </div>
    `).join("");

    const wfNames = {
      HARIYALI: "Carbon Accounting",
      CBAM: "CBAM Assessment",
      BRSR: "BRSR Disclosures"
    };
    const friendlyWf = wfNames[workflow] || "Assessment";

    const contentHtml = `
      <div class="upload-dialog-container">
        <div class="upload-dropzone" id="dropzoneEl">
          <div class="drop-icon">📁</div>
          <h3>Upload Activity Documents</h3>
          <p>Supports <strong>PDF, DOCX, XLSX, CSV, JPG, PNG</strong></p>
          <div class="upload-hint">Select a sample document below to simulate instant OCR extraction & semantic parsing:</div>
        </div>

        <div class="upload-progress-container hidden" id="uploadProgressContainer">
          <div class="upload-status-text" id="uploadStatusText">Uploading document...</div>
          <div class="upload-progress-bar">
            <div class="upload-progress-fill" id="uploadProgressFill" style="width: 0%"></div>
          </div>
        </div>

        <div class="sample-docs-section">
          <h4>Verified Sample Documents for ${friendlyWf}:</h4>
          <div class="sample-docs-grid">
            ${docsListHtml}
          </div>
        </div>
      </div>
    `;

    this.onDocSelectedCallback = onSelected;
    this.open(`Upload Activity Document — ${friendlyWf}`, contentHtml);
  }

  selectDoc(docId) {
    const doc = window.SAMPLE_DOCS.find(d => d.id === docId);
    if (!doc) return;

    const progressContainer = document.getElementById("uploadProgressContainer");
    const progressFill = document.getElementById("uploadProgressFill");
    const statusText = document.getElementById("uploadStatusText");

    if (progressContainer) {
      progressContainer.classList.remove("hidden");
      statusText.innerText = `Ingesting ${doc.name}...`;

      window.ocrEngine.simulateUpload(doc, 
        (pct) => {
          progressFill.style.width = pct + "%";
          if (pct === 50) statusText.innerText = "Running multi-column OCR & entity extraction...";
          if (pct === 100) statusText.innerText = "Extracting verified parameters...";
        },
        () => {
          this.close();
          if (this.onDocSelectedCallback) {
            this.onDocSelectedCallback(doc);
          }
        }
      );
    } else {
      this.close();
      if (this.onDocSelectedCallback) {
        this.onDocSelectedCallback(doc);
      }
    }
  }

  showReportPreview(type, data, mode = "ALL_AVAILABLE") {
    let title = "Statutory Report Preview";
    let reportHtml = "";

    if (type === "HARIYALI") {
      const isAll = (mode === "ALL_AVAILABLE");
      title = isAll
        ? "Consolidated HARIYALI GHG Emissions Report (All Available Data)"
        : `HARIYALI GHG Emissions Report (${data.month || 'Current Calculation'})`;
      const res = data.calculation_result || HARIYALI_DATA.calculate(data);
      reportHtml = this.buildHariyaliReportHtml(data, res, mode);
    } else if (type === "CBAM") {
      title = "EU CBAM Communication Template T-5 (Regulation EU 2023/956)";
      const res = data.calculation_result || CBAM_DATA.calculate(data);
      reportHtml = this.buildCbamReportHtml(data, res);
    } else if (type === "BRSR") {
      title = "SEBI BRSR Core Environmental Disclosures (Principle 6)";
      const res = data.calculation_result || BRSR_DATA.calculate(data.level, data.missing_data);
      reportHtml = this.buildBrsrReportHtml(data, res);
    } else if (type === "RFQ_DOCUMENT") {
      const rfq = data || (window.PROCUREMENT_DATA && window.PROCUREMENT_DATA.shared_store.current_rfq);
      title = `Template T-1 — Request for Quotation (RFQ)`;
      reportHtml = this.buildRfqDocumentHtml(rfq);
    } else if (type === "COMPARISON_DOCUMENT") {
      const report = data || (window.PROCUREMENT_DATA && (window.PROCUREMENT_DATA.shared_store.current_comparison || window.PROCUREMENT_DATA.generateComparativeStatement()));
      title = `Template T-2 — Bid Comparison Report (Comparative Statement)`;
      reportHtml = this.buildComparisonDocumentHtml(report);
    } else if (type === "PO_DOCUMENT") {
      const po = data || (window.PROCUREMENT_DATA && window.PROCUREMENT_DATA.shared_store.current_po);
      title = `Template T-3 — Work Order / Purchase Order (WO/PO)`;
      reportHtml = this.buildPoDocumentHtml(po);
    }

    this.open(title, reportHtml);
  }

  buildRfqDocumentHtml(rfq) {
    const r = rfq || {};
    const b = (r.buyer !== undefined && r.buyer !== null) ? r.buyer : (typeof window !== 'undefined' && window.PROCUREMENT_DATA ? window.PROCUREMENT_DATA.buyer : {});

    // 1. RFQ No mapping: PC-RFQ-{YYYY}-{####}
    const currentYear = new Date().getFullYear();
    let rfqNo = r.rfq_ref || (typeof window !== 'undefined' && window.PROCUREMENT_DATA && window.PROCUREMENT_DATA.shared_store && window.PROCUREMENT_DATA.shared_store.current_rfq_ref) || `PC-RFQ-${currentYear}-0113`;
    if (!rfqNo.startsWith("PC-")) {
      rfqNo = "PC-" + rfqNo;
    }

    // 2. RFQ Date mapping: dynamic actual date when RFQ is created (never hardcode 16 August 2026)
    let rfqDate = "";
    if (r.date_display) {
      rfqDate = r.date_display;
    } else if (r.created_at) {
      rfqDate = new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    } else {
      rfqDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    // 3. Buyer (our company) mapping: Name · Address · GSTIN · State
    // Rule: Buyer name and address: use only explicitly supplied information.
    let buyerParts = [];
    if (b && (b.name || b.company_name)) buyerParts.push(b.name || b.company_name);
    if (b && b.registered_address && b.registered_address.trim()) buyerParts.push(b.registered_address.trim());
    else if (b && b.address && b.address.trim()) buyerParts.push(b.address.trim());
    if (b && b.gstin && b.gstin.trim()) buyerParts.push("GSTIN: " + b.gstin.trim());
    if (b && b.state && b.state.trim()) buyerParts.push(b.state.trim());
    const buyerStr = buyerParts.length > 0 ? buyerParts.join(" · ") : "Apex Green Metals Pvt Ltd";

    // 4. Contact for queries mapping: Name · Mobile / WhatsApp · Email
    // Populate with sample contact details for Apex Green Metals Pvt Ltd (clearly identified demo placeholder)
    let contactParts = [];
    const cName = (b && (b.contact_name || b.authorized_signatory) && (b.contact_name || b.authorized_signatory).trim())
      ? (b.contact_name || b.authorized_signatory).trim()
      : "Procurement Desk";
    const cPhone = (b && b.contact_phone && b.contact_phone.trim())
      ? b.contact_phone.trim()
      : "+91 90000 00000 (Demo placeholder)";
    const cEmail = (b && b.contact_email && b.contact_email.trim())
      ? b.contact_email.trim()
      : "procurement@example.com";

    if (cName) contactParts.push(cName);
    if (cPhone) contactParts.push(cPhone);
    if (cEmail) contactParts.push(cEmail);
    const contactStr = contactParts.length > 0 ? contactParts.join(" · ") : "Not specified";

    // 5. Quotation due by (date & time)
    // PART A rule: If missing -> "Not specified"
    const dueDateStr = (r.quotation_deadline && r.quotation_deadline.trim()) ? r.quotation_deadline.trim() : "Not specified";

    // 6. Quote validity required
    // PART A rule: If missing -> "Not specified"
    let validityStr = "Not specified";
    if (r.quote_validity && r.quote_validity.trim() && !r.quote_validity.includes("____")) {
      validityStr = r.quote_validity.trim();
    }

    // Items Required mapping
    const itemDesc = (r.material && r.material.trim()) ? r.material.trim() : "Not specified";
    const itemSpecs = r.technical_specs || (r.detailed_specs ? `${r.detailed_specs.variety || ''}, ${r.detailed_specs.size || ''}, ${r.detailed_specs.quality || ''}` : "Not specified");
    const itemQty = (r.quantity != null && r.quantity !== "") ? r.quantity.toLocaleString() : "Not specified";
    const itemUnit = (r.unit && r.unit.trim()) ? r.unit.trim() : "Not specified";
    const itemDelivery = (r.delivery_required_by && r.delivery_required_by.trim()) ? r.delivery_required_by.trim() : "Not specified";

    // Terms of this RFQ mapping
    // Rule: Every term is buyer-configurable.
    // If supplied: display buyer's actual value.
    // If skipped: display "Not specified".
    // If explicitly declined: display "Not required".
    // If edited: display latest confirmed value.
    function resolveTerm(val) {
      if (val === null || val === undefined) return "Not specified";
      if (typeof val === 'string') {
        const t = val.trim();
        if (!t || t.toLowerCase() === "not specified") return "Not specified";
        if (t.toLowerCase() === "not required" || t.toLowerCase() === "no" || t.toLowerCase() === "exempted") return "Not required";
        if (t.includes("____") || t.includes("______")) return "Not specified";
        return t;
      }
      return String(val);
    }

    const tCfg = r.terms_config || (r.terms && typeof r.terms === 'object' && !Array.isArray(r.terms) ? r.terms : {});
    const tArr = Array.isArray(r.terms) ? r.terms : [];

    const term1Req = resolveTerm(tCfg.term_1 ?? r.term_1 ?? (tArr[0] ? tArr[0].requirement : null));
    const term2Req = resolveTerm(r.delivery_location ?? tCfg.term_2 ?? r.term_2 ?? (tArr[1] ? tArr[1].requirement : null));
    const term3Req = resolveTerm(r.payment_terms ?? tCfg.term_3 ?? r.term_3 ?? (tArr[2] ? tArr[2].requirement : null));
    const term4Req = resolveTerm(tCfg.term_4 ?? r.term_4 ?? (tArr[3] ? tArr[3].requirement : null));
    const term5Req = resolveTerm(tCfg.term_5 ?? r.term_5 ?? (tArr[4] ? tArr[4].requirement : null));
    const term6Req = resolveTerm(tCfg.term_6 ?? r.term_6 ?? (tArr[5] ? tArr[5].requirement : null));
    const term7Req = resolveTerm(tCfg.term_7 ?? r.term_7 ?? (tArr[6] ? tArr[6].requirement : null));
    const term8Req = resolveTerm(tCfg.term_8 ?? r.term_8 ?? (tArr[7] ? tArr[7].requirement : null));

    return `
      <div class="rfq-t1-document" style="font-family: Calibri, -apple-system, BlinkMacSystemFont, Arial, sans-serif; color: #222222; background: #ffffff; padding: 24px 32px; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important;">
        <!-- Document Title Block -->
        <div style="font-family: Cambria, 'Times New Roman', Georgia, serif; font-size: 13px; font-weight: bold; color: #6b8e4e; text-transform: uppercase; margin: 0 0 2px 0; letter-spacing: 0.5px;">
          TEMPLATE T-1
        </div>
        <div style="font-family: Cambria, 'Times New Roman', Georgia, serif; font-size: 21px; font-weight: bold; color: #1e4d2b; margin: 0 0 6px 0; line-height: 1.2;">
          Request for Quotation (RFQ)
        </div>
        <div style="border-bottom: 2px solid #1e4d2b; margin-bottom: 12px;"></div>

        <!-- Header details table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; border: 1px solid #6b8e4e; font-family: Calibri, Arial, sans-serif; font-size: 12px; line-height: 1.35; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
          <tbody>
            <tr>
              <td style="width: 32%; font-weight: bold; padding: 4.5px 8px; border: 1px solid #6b8e4e; background-color: #f7f4ea !important; box-shadow: inset 0 0 0 1000px #f7f4ea !important; color: #1e4d2b; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">RFQ No.</td>
              <td style="width: 68%; padding: 4.5px 8px; border: 1px solid #6b8e4e; background-color: #ffffff !important; color: #222222; font-weight: bold;">${rfqNo}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 4.5px 8px; border: 1px solid #6b8e4e; background-color: #f7f4ea !important; box-shadow: inset 0 0 0 1000px #f7f4ea !important; color: #1e4d2b; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">RFQ Date</td>
              <td style="padding: 4.5px 8px; border: 1px solid #6b8e4e; background-color: #ffffff !important; color: #222222;">${rfqDate}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 4.5px 8px; border: 1px solid #6b8e4e; background-color: #f7f4ea !important; box-shadow: inset 0 0 0 1000px #f7f4ea !important; color: #1e4d2b; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">Buyer (our company)</td>
              <td style="padding: 4.5px 8px; border: 1px solid #6b8e4e; background-color: #ffffff !important; color: #222222;">${buyerStr}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 4.5px 8px; border: 1px solid #6b8e4e; background-color: #f7f4ea !important; box-shadow: inset 0 0 0 1000px #f7f4ea !important; color: #1e4d2b; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">Contact for queries</td>
              <td style="padding: 4.5px 8px; border: 1px solid #6b8e4e; background-color: #ffffff !important; color: #222222;">${contactStr}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 4.5px 8px; border: 1px solid #6b8e4e; background-color: #f7f4ea !important; box-shadow: inset 0 0 0 1000px #f7f4ea !important; color: #1e4d2b; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">Quotation due by (date & time)</td>
              <td style="padding: 4.5px 8px; border: 1px solid #6b8e4e; background-color: #ffffff !important; color: #222222;">${dueDateStr}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 4.5px 8px; border: 1px solid #6b8e4e; background-color: #f7f4ea !important; box-shadow: inset 0 0 0 1000px #f7f4ea !important; color: #1e4d2b; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">Quote validity required</td>
              <td style="padding: 4.5px 8px; border: 1px solid #6b8e4e; background-color: #ffffff !important; color: #222222;">${validityStr}</td>
            </tr>
          </tbody>
        </table>

        <!-- Items required Section -->
        <div style="font-family: Cambria, 'Times New Roman', Georgia, serif; font-size: 16px; font-weight: bold; color: #6b8e4e; margin: 14px 0 6px 0;">
          Items required
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; border: 1px solid #6b8e4e; font-family: Calibri, Arial, sans-serif; font-size: 12px; line-height: 1.35; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
          <thead>
            <tr style="background-color: #1e4d2b !important; color: #ffffff !important;">
              <th style="padding: 5px 6px; border: 1px solid #6b8e4e; width: 7%; font-family: Cambria, 'Times New Roman', Georgia, serif; font-size: 12px; text-align: left; font-weight: bold; background-color: #1e4d2b !important; box-shadow: inset 0 0 0 1000px #1e4d2b !important; color: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">S.No</th>
              <th style="padding: 5px 6px; border: 1px solid #6b8e4e; width: 28%; font-family: Cambria, 'Times New Roman', Georgia, serif; font-size: 12px; text-align: left; font-weight: bold; background-color: #1e4d2b !important; box-shadow: inset 0 0 0 1000px #1e4d2b !important; color: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">Item description</th>
              <th style="padding: 5px 6px; border: 1px solid #6b8e4e; width: 30%; font-family: Cambria, 'Times New Roman', Georgia, serif; font-size: 12px; text-align: left; font-weight: bold; background-color: #1e4d2b !important; box-shadow: inset 0 0 0 1000px #1e4d2b !important; color: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">Specification / grade / brand</th>
              <th style="padding: 5px 6px; border: 1px solid #6b8e4e; width: 9%; font-family: Cambria, 'Times New Roman', Georgia, serif; font-size: 12px; text-align: left; font-weight: bold; background-color: #1e4d2b !important; box-shadow: inset 0 0 0 1000px #1e4d2b !important; color: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">Qty</th>
              <th style="padding: 5px 6px; border: 1px solid #6b8e4e; width: 9%; font-family: Cambria, 'Times New Roman', Georgia, serif; font-size: 12px; text-align: left; font-weight: bold; background-color: #1e4d2b !important; box-shadow: inset 0 0 0 1000px #1e4d2b !important; color: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">Unit</th>
              <th style="padding: 5px 6px; border: 1px solid #6b8e4e; width: 17%; font-family: Cambria, 'Times New Roman', Georgia, serif; font-size: 12px; text-align: left; font-weight: bold; background-color: #1e4d2b !important; box-shadow: inset 0 0 0 1000px #1e4d2b !important; color: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">Delivery required by</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background-color: #f7f4ea !important;">
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #f7f4ea !important; box-shadow: inset 0 0 0 1000px #f7f4ea !important; color: #222222; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">1</td>
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #f7f4ea !important; box-shadow: inset 0 0 0 1000px #f7f4ea !important; color: #222222; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">${itemDesc}</td>
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #f7f4ea !important; box-shadow: inset 0 0 0 1000px #f7f4ea !important; color: #222222; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">${itemSpecs}</td>
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #f7f4ea !important; box-shadow: inset 0 0 0 1000px #f7f4ea !important; color: #222222; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">${itemQty}</td>
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #f7f4ea !important; box-shadow: inset 0 0 0 1000px #f7f4ea !important; color: #222222; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">${itemUnit}</td>
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #f7f4ea !important; box-shadow: inset 0 0 0 1000px #f7f4ea !important; color: #222222; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">${itemDelivery}</td>
            </tr>
            <tr style="background-color: #ffffff !important;">
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #ffffff !important; color: #222222;">2</td>
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #ffffff !important;">&nbsp;</td>
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #ffffff !important;">&nbsp;</td>
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #ffffff !important;">&nbsp;</td>
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #ffffff !important;">&nbsp;</td>
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #ffffff !important;">&nbsp;</td>
            </tr>
            <tr style="background-color: #f7f4ea !important;">
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #f7f4ea !important; box-shadow: inset 0 0 0 1000px #f7f4ea !important; color: #222222; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">3</td>
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #f7f4ea !important; box-shadow: inset 0 0 0 1000px #f7f4ea !important; color: #222222; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">&nbsp;</td>
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #f7f4ea !important; box-shadow: inset 0 0 0 1000px #f7f4ea !important; color: #222222; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">&nbsp;</td>
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #f7f4ea !important; box-shadow: inset 0 0 0 1000px #f7f4ea !important; color: #222222; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">&nbsp;</td>
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #f7f4ea !important; box-shadow: inset 0 0 0 1000px #f7f4ea !important; color: #222222; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">&nbsp;</td>
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #f7f4ea !important; box-shadow: inset 0 0 0 1000px #f7f4ea !important; color: #222222; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">&nbsp;</td>
            </tr>
          </tbody>
        </table>

        <!-- Terms of this RFQ Section -->
        <div style="font-family: Cambria, 'Times New Roman', Georgia, serif; font-size: 16px; font-weight: bold; color: #6b8e4e; margin: 14px 0 6px 0;">
          Terms of this RFQ
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; border: 1px solid #6b8e4e; font-family: Calibri, Arial, sans-serif; font-size: 11.5px; line-height: 1.35; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
          <thead>
            <tr style="background-color: #1e4d2b !important; color: #ffffff !important;">
              <th style="padding: 5px 6px; border: 1px solid #6b8e4e; width: 6%; font-family: Cambria, 'Times New Roman', Georgia, serif; font-size: 12px; text-align: left; font-weight: bold; background-color: #1e4d2b !important; box-shadow: inset 0 0 0 1000px #1e4d2b !important; color: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">#</th>
              <th style="padding: 5px 6px; border: 1px solid #6b8e4e; width: 22%; font-family: Cambria, 'Times New Roman', Georgia, serif; font-size: 12px; text-align: left; font-weight: bold; background-color: #1e4d2b !important; box-shadow: inset 0 0 0 1000px #1e4d2b !important; color: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">Term</th>
              <th style="padding: 5px 6px; border: 1px solid #6b8e4e; width: 72%; font-family: Cambria, 'Times New Roman', Georgia, serif; font-size: 12px; text-align: left; font-weight: bold; background-color: #1e4d2b !important; box-shadow: inset 0 0 0 1000px #1e4d2b !important; color: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">Requirement</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background-color: #f7f4ea !important;">
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #f7f4ea !important; box-shadow: inset 0 0 0 1000px #f7f4ea !important; color: #222222; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">1</td>
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #f7f4ea !important; box-shadow: inset 0 0 0 1000px #f7f4ea !important; color: #222222; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">Price basis</td>
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #f7f4ea !important; box-shadow: inset 0 0 0 1000px #f7f4ea !important; color: #222222; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">${term1Req}</td>
            </tr>
            <tr style="background-color: #ffffff !important;">
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #ffffff !important; color: #222222;">2</td>
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #ffffff !important; color: #222222;">Delivery location</td>
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #ffffff !important; color: #222222;">${term2Req}</td>
            </tr>
            <tr style="background-color: #f7f4ea !important;">
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #f7f4ea !important; box-shadow: inset 0 0 0 1000px #f7f4ea !important; color: #222222; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">3</td>
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #f7f4ea !important; box-shadow: inset 0 0 0 1000px #f7f4ea !important; color: #222222; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">Payment terms offered</td>
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #f7f4ea !important; box-shadow: inset 0 0 0 1000px #f7f4ea !important; color: #222222; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">${term3Req}</td>
            </tr>
            <tr style="background-color: #ffffff !important;">
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #ffffff !important; color: #222222;">4</td>
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #ffffff !important; color: #222222;">GST & invoicing</td>
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #ffffff !important; color: #222222;">${term4Req}</td>
            </tr>
            <tr style="background-color: #f7f4ea !important;">
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #f7f4ea !important; box-shadow: inset 0 0 0 1000px #f7f4ea !important; color: #222222; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">5</td>
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #f7f4ea !important; box-shadow: inset 0 0 0 1000px #f7f4ea !important; color: #222222; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">Quality documents</td>
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #f7f4ea !important; box-shadow: inset 0 0 0 1000px #f7f4ea !important; color: #222222; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">${term5Req}</td>
            </tr>
            <tr style="background-color: #ffffff !important;">
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #ffffff !important; color: #222222;">6</td>
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #ffffff !important; color: #222222;">Origin declaration</td>
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #ffffff !important; color: #222222;">${term6Req}</td>
            </tr>
            <tr style="background-color: #f7f4ea !important;">
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #f7f4ea !important; box-shadow: inset 0 0 0 1000px #f7f4ea !important; color: #222222; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">7</td>
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #f7f4ea !important; box-shadow: inset 0 0 0 1000px #f7f4ea !important; color: #222222; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">How to submit</td>
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #f7f4ea !important; box-shadow: inset 0 0 0 1000px #f7f4ea !important; color: #222222; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">${term7Req}</td>
            </tr>
            <tr style="background-color: #ffffff !important;">
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #ffffff !important; color: #222222;">8</td>
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #ffffff !important; color: #222222;">Right of buyer</td>
              <td style="padding: 4px 6px; border: 1px solid #6b8e4e; background-color: #ffffff !important; color: #222222;">${term8Req}</td>
            </tr>
          </tbody>
        </table>

        <!-- Purechain note (T-1) Callout Box -->
        <div style="border-left: 4.5px solid #1e4d2b !important; background-color: #f7f4ea !important; box-shadow: inset 0 0 0 1000px #f7f4ea !important; padding: 8px 12px; margin-top: 14px; font-family: Calibri, Arial, sans-serif; font-size: 11px; line-height: 1.4; color: #222222; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
          <div style="font-family: Cambria, 'Times New Roman', Georgia, serif; font-size: 13.5px; font-weight: bold; color: #1e4d2b; margin-bottom: 3px;">Purechain note (T-1)</div>
          <div style="font-style: italic;">PureChain can generate and send this RFQ to shortlisted suppliers directly on WhatsApp from a voice note like "3 suppliers ko 500 kg SS-304 rod ka rate maango". Incoming quotes are parsed into the bid table for T-2. Automated GST verification checks each responding supplier's GSTIN before their quote is shown as valid.</div>
        </div>

        <!-- Interactive Modal Actions (Screen view only) -->
        <div class="report-actions" style="margin-top: 18px; display: flex; justify-content: flex-end; gap: 10px;">
          <button class="btn-download" onclick="window.print()">🖨️ Print / Save as PDF (A4)</button>
          <button class="btn-secondary" onclick="window.documentModal.close()">✕ Close Preview</button>
        </div>
      </div>
    `;
  }

  buildComparisonDocumentHtml(reportData) {
    const report = reportData || (typeof window !== 'undefined' && window.PROCUREMENT_DATA ? window.PROCUREMENT_DATA.generateComparativeStatement() : {});
    const columns = report.columns || [];
    const dec = report.decision || {};

    const colCount = columns.length;
    const criteriaWidth = 28;
    const suppWidth = colCount > 0 ? (72 / colCount) : 72;

    return `
      <div class="t2-comparison-document">
        <!-- Document Header -->
        <div class="t2-header">
          <div class="t2-template-tag">TEMPLATE T-2</div>
          <div class="t2-title">Bid Comparison Report (Comparative Statement)</div>
        </div>
        <div class="t2-divider"></div>

        <!-- SECTION A — RFQ SUMMARY -->
        <table class="t2-table t2-summary-table">
          <tbody>
            <tr>
              <td class="t2-label">Comparison Ref.</td>
              <td class="t2-value">${report.comparison_ref || 'PC-BCR-2026-0113'}</td>
            </tr>
            <tr>
              <td class="t2-label">Against RFQ No. / Date</td>
              <td class="t2-value">${report.rfq_ref || 'PC-RFQ-2026-0113'} / ${report.rfq_date || '08 Nov 2026'}</td>
            </tr>
            <tr>
              <td class="t2-label">Item(s) & quantity</td>
              <td class="t2-value">${report.item_and_quantity || 'Onion, 50.000 MT'}</td>
            </tr>
            <tr>
              <td class="t2-label">Quotes received / considered</td>
              <td class="t2-value">${report.quotes_summary_line || ''}</td>
            </tr>
            <tr>
              <td class="t2-label">Prepared on</td>
              <td class="t2-value">${report.prepared_on || '08 Nov 2026'}</td>
            </tr>
          </tbody>
        </table>

        <!-- SECTION B — COMPARISON MATRIX -->
        <div class="t2-section-heading">Comparison matrix</div>
        <table class="t2-table t2-matrix-table">
          <thead>
            <tr>
              <th class="t2-criteria-th" style="width: ${criteriaWidth}%;">Criteria</th>
              ${columns.map(c => `<th style="width: ${suppWidth}%;">${c.supplier_name}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            <!-- Row 1: Quoted rate (INR /unit) -->
            <tr>
              <td class="t2-criteria-col">Quoted rate (INR /unit)</td>
              ${columns.map(c => `<td style="${c.status === 'SUBMITTED' ? 'font-weight: bold;' : ''}">${c.quoted_rate_display}</td>`).join("")}
            </tr>
            <!-- Row 2: GST rate & amount -->
            <tr class="t2-row-alt">
              <td class="t2-criteria-col">GST rate & amount</td>
              ${columns.map(c => `<td>${c.gst_display}</td>`).join("")}
            </tr>
            <!-- Row 3: Freight / other charges (INR ) -->
            <tr>
              <td class="t2-criteria-col">Freight / other charges (INR )</td>
              ${columns.map(c => `<td>${c.freight_display}</td>`).join("")}
            </tr>
            <!-- Row 4: Landed cost per unit (INR ) - the real comparison number -->
            <tr class="t2-row-landed">
              <td class="t2-criteria-col"><strong>Landed cost per unit (INR ) - the<br>real comparison number</strong></td>
              ${columns.map(c => `<td><strong>${c.landed_cost_per_unit_display}</strong></td>`).join("")}
            </tr>
            <!-- Row 5: Total landed cost (INR ) -->
            <tr class="t2-row-total">
              <td class="t2-criteria-col">Total landed cost (INR )</td>
              ${columns.map(c => `<td>${c.total_landed_cost_display}</td>`).join("")}
            </tr>
            <!-- Row 6: Payment terms asked -->
            <tr class="t2-row-alt">
              <td class="t2-criteria-col">Payment terms asked</td>
              ${columns.map(c => `<td>${c.payment_terms}</td>`).join("")}
            </tr>
            <!-- Row 7: Delivery period offered -->
            <tr>
              <td class="t2-criteria-col">Delivery period offered</td>
              ${columns.map(c => `<td>${c.delivery_period}</td>`).join("")}
            </tr>
            <!-- Row 8: Quality docs offered (TC/CoA/ISO) -->
            <tr class="t2-row-alt">
              <td class="t2-criteria-col">Quality docs offered (TC/CoA/ISO)</td>
              ${columns.map(c => `<td>${c.quality_docs}</td>`).join("")}
            </tr>
            <!-- Row 9: Quote validity -->
            <tr>
              <td class="t2-criteria-col">Quote validity</td>
              ${columns.map(c => `<td>${c.quote_validity}</td>`).join("")}
            </tr>
            <!-- Row 10: Past performance with us (Good / OK / Poor / New) -->
            <tr class="t2-row-alt">
              <td class="t2-criteria-col">Past performance with us (Good /<br>OK / Poor / New)</td>
              ${columns.map(c => `<td>${c.past_performance}</td>`).join("")}
            </tr>
            <!-- Row 11: GST verification -->
            <tr>
              <td class="t2-criteria-col">GST verification</td>
              ${columns.map(c => `<td>${c.rakshak_status}</td>`).join("")}
            </tr>
            <!-- Row 12: Market Price Benchmark -->
            <tr class="t2-row-alt">
              <td class="t2-criteria-col">Market Price Benchmark</td>
              ${columns.map(c => `<td>${c.daam_guru_status}</td>`).join("")}
            </tr>
            <!-- Row 13: Rank by landed cost (L1 / L2 / L3) -->
            <tr class="t2-row-rank">
              <td class="t2-criteria-col">Rank by landed cost (L1 / L2 / L3)</td>
              ${columns.map(c => `<td>${c.rank_display}</td>`).join("")}
            </tr>
          </tbody>
        </table>

        <!-- Market Price Benchmark Simulation Disclosure -->
        <div class="t2-benchmark-disclosure" style="font-size: 5.5pt; color: #4a5550; font-style: italic; margin: 1px 0 4px 0; text-align: right;">
          * ${report.daam_guru_disclosure || 'Market price benchmark uses illustrative demo data for simulation purposes only. It is not a live or verified market quotation.'}
        </div>

        <!-- SECTION C — DECISION -->
        <div class="t2-section-heading">Decision</div>
        <table class="t2-table t2-decision-table">
          <tbody>
            <tr>
              <td class="t2-label">Recommended supplier</td>
              <td class="t2-value"><strong>${dec.recommended_supplier || 'No recommendation'}</strong></td>
            </tr>
            <tr>
              <td class="t2-label">Reason (if not L1, must state why)</td>
              <td class="t2-value">${dec.reason || ''}</td>
            </tr>
            <tr>
              <td class="t2-label">Negotiation attempted?</td>
              <td class="t2-value">${dec.negotiation_attempted || 'No - direct evaluation (commercial assist available if required)'}</td>
            </tr>
            <tr>
              <td class="t2-label">Approved quantity split (if any)</td>
              <td class="t2-value">${dec.approved_quantity_split || 'Pending buyer approval'}</td>
            </tr>
          </tbody>
        </table>

        <!-- Signatures Line -->
        <div class="t2-signatures">
          <div>Prepared by (name &amp; date): &nbsp;<strong>${dec.prepared_by || 'Procurement Desk'}</strong></div>
          <div>Approved by Owner / MD: &nbsp;<strong>${dec.approved_by || 'Pending buyer approval'}</strong></div>
        </div>

        <!-- SECTION D — PURECHAIN NOTE -->
        <div class="t2-callout">
          <div class="t2-callout-title">Purechain note (T-2)</div>
          <div>${report.note || 'Golden rule for MSMEs: compare LANDED COST (rate + GST impact + freight), never the bare quoted rate - the cheapest quote is often not the cheapest supplier. The GST verification row is pass/fail: a supplier failing verification cannot be recommended regardless of price. The Market Price Benchmark row shows whether even the L1 price is above market.'}</div>
        </div>

        <!-- Interactive Modal Actions (Screen view only) -->
        <div class="report-actions" style="margin-top: 16px; display: flex; justify-content: flex-end; gap: 10px;">
          <button class="btn-download" onclick="window.print()">🖨️ Print / Save as PDF (A4)</button>
          <button class="btn-secondary" onclick="window.documentModal.close()">✕ Close Preview</button>
        </div>
      </div>
    `;
  }

  buildPoDocumentHtml(poData) {
    const po = poData || (typeof window !== "undefined" && window.PROCUREMENT_DATA && window.PROCUREMENT_DATA.shared_store.current_po);
    if (!po) {
      return `<div style="padding: 30px; text-align: center; color: #555;"><h3>No Purchase Order Issued Yet</h3><p>Please complete buyer quotation review and sign-off in the procurement desk to generate Template T-3.</p></div>`;
    }
    const innerHtml = (typeof window !== "undefined" && window.PROCUREMENT_DATA && window.PROCUREMENT_DATA.generatePoDocumentHtml)
      ? window.PROCUREMENT_DATA.generatePoDocumentHtml(po)
      : (po.document_html || "<p>Purchase order document preview unavailable.</p>");

    return `
      <div class="po-preview-wrapper">
        ${innerHtml}
        <div class="report-actions" style="margin-top: 16px; display: flex; justify-content: flex-end; gap: 10px;">
          <button class="btn-download" onclick="window.print()">🖨️ Print / Save as PDF (A4)</button>
          <button class="btn-secondary" onclick="window.documentModal.close()">✕ Close Preview</button>
        </div>
      </div>
    `;
  }

  buildHariyaliReportHtml(state, res, mode = "ALL_AVAILABLE") {
    const isAll = (mode === "ALL_AVAILABLE");
    const months = HARIYALI_DATA.confirmed_months;
    const currentMonth = state.month || "November 2025";

    let monthlyRowsHtml = "";
    let consolidatedTotal = 0;
    if (isAll) {
      months.forEach(m => {
        consolidatedTotal += m.footprint_tco2e;
        monthlyRowsHtml += `
          <tr>
            <td><strong>${m.display}</strong></td>
            <td>${m.diesel_litres.toLocaleString()} L</td>
            <td>${m.electricity_kwh.toLocaleString()} kWh</td>
            <td>${m.production_tonnes} t</td>
            <td><strong>${m.footprint_tco2e.toFixed(2)} tCO₂e</strong></td>
          </tr>
        `;
      });
      // Add current calculated month
      consolidatedTotal += res.total_emissions_tco2e;
      monthlyRowsHtml += `
        <tr style="background-color: rgba(0, 168, 132, 0.08);">
          <td><strong>${currentMonth} (Current)</strong></td>
          <td>${res.scope1.quantity.toLocaleString()} L</td>
          <td>${res.scope2.quantity.toLocaleString()} kWh</td>
          <td>${res.production_tonnes} t</td>
          <td><strong>${res.total_emissions_tco2e.toFixed(2)} tCO₂e</strong></td>
        </tr>
      `;
    }

    return `
      <div class="report-paper">
        <div class="report-header">
          <div class="report-brand">
            <span class="report-badge">🌱 PURECHAIN CARBON</span>
            <h2>GREENHOUSE GAS EMISSIONS ASSESSMENT REPORT</h2>
            <div class="report-sub">${isAll ? 'Consolidated Assessment (All Available Monthly Records)' : 'Statement of Current Calculation Execution'} • GHG Protocol & ISO 14064-1</div>
          </div>
          <div class="report-qr">
            <div class="qr-box">VERIFIED<br>REPORT</div>
          </div>
        </div>

        <div class="report-meta-grid">
          <div><strong>Company:</strong> ${state.company_name}</div>
          <div><strong>Assessment ID:</strong> PC-GHG-2025-26-${Math.floor(1000 + Math.random()*9000)}</div>
          <div><strong>Facility:</strong> ${state.facility_name || state.location}</div>
          <div><strong>Reporting Period:</strong> ${state.reporting_period || 'FY 2025–26'}</div>
          <div><strong>Coverage Mode:</strong> ${isAll ? 'All Available Monthly Data' : 'Current Month Only (' + currentMonth + ')'}</div>
          <div><strong>Generated Date:</strong> ${new Date().toLocaleDateString('en-GB')}</div>
        </div>

        ${isAll ? `
        <h3>1. Multi-Month Activity & Emissions Ledger</h3>
        <div class="report-table-wrapper">
          <table class="report-table">
            <thead>
              <tr>
                <th>Activity Month</th>
                <th>Scope 1 (Diesel)</th>
                <th>Scope 2 (Electricity)</th>
                <th>Production</th>
                <th>Emissions</th>
              </tr>
            </thead>
            <tbody>
              ${monthlyRowsHtml}
              <tr class="total-row">
                <td colspan="4"><strong>CONSOLIDATED CUMULATIVE TOTAL</strong></td>
                <td><strong>${consolidatedTotal.toFixed(2)} tCO₂e</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        ` : ''}

        <h3>${isAll ? '2. Current Month Activity Details (' + currentMonth + ')' : '1. Calculation Breakdown (' + currentMonth + ')'}</h3>
        <div class="report-table-wrapper">
          <table class="report-table">
            <thead>
              <tr>
                <th>Emission Scope</th>
                <th>Activity Source</th>
                <th>Quantity</th>
                <th>Emission Factor</th>
                <th>Emissions (tCO₂e)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Scope 1 (Direct)</strong></td>
                <td>High Speed Diesel (HSD)</td>
                <td>${res.scope1.quantity.toLocaleString()} Litres</td>
                <td>0.002685 tCO₂e/L (IPCC AR5)</td>
                <td><strong>${res.scope1.emissions_tco2e.toFixed(4)}</strong></td>
              </tr>
              <tr>
                <td><strong>Scope 2 (Indirect)</strong></td>
                <td>Purchased Grid Electricity</td>
                <td>${res.scope2.quantity.toLocaleString()} kWh</td>
                <td>0.675000 tCO₂/MWh (CEA v22.0)</td>
                <td><strong>${res.scope2.emissions_tco2e.toFixed(4)}</strong></td>
              </tr>
              ${res.scope3 ? `
              <tr>
                <td><strong>Scope 3 (Supply Chain)</strong></td>
                <td>Upstream Freight Logistics</td>
                <td>₹${res.scope3.spend_inr.toLocaleString()}</td>
                <td>Spend-based GWP</td>
                <td><strong>${res.scope3.emissions_tco2e.toFixed(4)}</strong></td>
              </tr>` : ''}
              <tr class="total-row">
                <td colspan="4"><strong>TOTAL (${currentMonth.toUpperCase()})</strong></td>
                <td><strong>${res.total_emissions_tco2e.toFixed(4)} tCO₂e</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>${isAll ? '3. Intensity & Verification Metrics' : '2. Intensity Metrics'}</h3>
        <div class="kpi-boxes">
          <div class="kpi-box">
            <span class="kpi-val">${res.carbon_intensity_tco2e_per_tonne.toFixed(4)}</span>
            <span class="kpi-lbl">tCO₂e / tonne Product</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-val">${Math.round(res.total_emissions_kg).toLocaleString()}</span>
            <span class="kpi-lbl">Total kg CO₂e (${currentMonth})</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-val">100%</span>
            <span class="kpi-lbl">Statutory Compliance</span>
          </div>
        </div>

        <div class="report-actions">
          <button class="btn-download" onclick="window.documentModal.downloadMockFile('${isAll ? 'Purechain_HARIYALI_GHG_Report_All_Available.pdf' : 'Purechain_HARIYALI_GHG_Report_Current.pdf'}')">📥 Download PDF Report</button>
          <button class="btn-secondary" onclick="window.print()">🖨️ Print</button>
        </div>
      </div>
    `;
  }

  buildCbamReportHtml(state, res) {
    return `
      <div class="report-paper">
        <div class="report-header">
          <div class="report-brand">
            <span class="report-badge">🇪🇺 EU CBAM TEMPLATE T-5</span>
            <h2>INSTALLATION & PRODUCT ATTRIBUTION DECLARATION</h2>
            <div class="report-sub">Pursuant to Regulation (EU) 2023/956, Annex III & Commission Implementing Reg (EU) 2023/1773</div>
          </div>
          <div class="report-qr">
            <div class="qr-box">CBAM<br>T-5</div>
          </div>
        </div>

        <div class="report-meta-grid">
          <div><strong>Non-EU Operator:</strong> ${state.company_name}</div>
          <div><strong>Installation ID:</strong> IN-GUJ-HAZ-0018</div>
          <div><strong>Facility Name:</strong> ${state.installation_name} (${state.installation_country})</div>
          <div><strong>Reporting Period:</strong> ${state.period}</div>
          <div><strong>Product Name:</strong> ${res.product_name}</div>
          <div><strong>CN Code:</strong> ${res.cn_code} (Iron & Steel)</div>
        </div>

        <h3>1. Embedded Emissions Attribution Breakdown</h3>
        <div class="report-table-wrapper">
          <table class="report-table">
            <thead>
              <tr>
                <th>Attribution Element</th>
                <th>Physical Value</th>
                <th>Adjustment / Status</th>
                <th>Embedded Emissions (tCO₂e)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Gross Direct Emissions ($DirEm$)</strong></td>
                <td>${res.direct_emissions_tco2e.toLocaleString()} tCO₂e</td>
                <td>Combustion & Process</td>
                <td>${res.direct_emissions_tco2e.toFixed(2)}</td>
              </tr>
              <tr>
                <td><strong>Biomass Deduction (RED II)</strong></td>
                <td>${(res.biomass_fraction * 100).toFixed(1)}% Fraction</td>
                <td>${res.biomass_status}</td>
                <td>-${res.biomass_credit_tco2e.toFixed(2)}</td>
              </tr>
              <tr>
                <td><strong>Energy Transfers (Guidance 3 Eq 55)</strong></td>
                <td>Heat Imported: ${res.heat_imported_emissions} tCO₂e</td>
                <td>REPORTED</td>
                <td>+${res.heat_imported_emissions.toFixed(2)}</td>
              </tr>
              <tr>
                <td><strong>Indirect Emissions (Electricity)</strong></td>
                <td>${state.electricity_mwh.toLocaleString()} MWh</td>
                <td>Annex I Included</td>
                <td>${res.indirect_emissions_tco2e.toFixed(2)}</td>
              </tr>
              <tr>
                <td><strong>Precursor Emissions (DRI)</strong></td>
                <td>4,200.0 tonnes consumed</td>
                <td>SEE: 1.820000 tCO₂e/t</td>
                <td>${res.precursor_emissions_tco2e.toFixed(2)}</td>
              </tr>
              <tr class="total-row">
                <td colspan="3"><strong>TOTAL EMBEDDED EMISSIONS</strong></td>
                <td><strong>${res.total_embedded_emissions_tco2e.toFixed(2)} tCO₂e</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>2. Specific Embedded Emissions & EU Liability</h3>
        <div class="kpi-boxes">
          <div class="kpi-box">
            <span class="kpi-val">${res.specific_embedded_emissions.toFixed(6)}</span>
            <span class="kpi-lbl">SEE (tCO₂e / tonne)</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-val">${res.certificate_quantity.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}</span>
            <span class="kpi-lbl">CBAM Certificates (EU)</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-val">€${res.estimated_indicative_cost_eur.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
            <span class="kpi-lbl">Indicative Exposure</span>
          </div>
        </div>

        <div class="report-actions">
          <button class="btn-download" onclick="window.documentModal.downloadMockFile('Purechain_CBAM_Template_T5.docx')">📥 Download DOCX</button>
          <button class="btn-download" onclick="window.documentModal.downloadMockFile('Purechain_CBAM_Template_T5.pdf')">📥 Download PDF</button>
        </div>
      </div>
    `;
  }

  buildBrsrReportHtml(state, res) {
    return `
      <div class="report-paper">
        <div class="report-header">
          <div class="report-brand">
            <span class="report-badge">🇮🇳 SEBI BRSR CORE</span>
            <h2>BUSINESS RESPONSIBILITY & SUSTAINABILITY REPORT</h2>
            <div class="report-sub">Principle 6: Environmental Management & Emissions Reconciled</div>
          </div>
          <div class="report-qr">
            <div class="qr-box">SEBI<br>BRSR</div>
          </div>
        </div>

        <div class="report-meta-grid">
          <div><strong>Entity:</strong> ${state.company_name}</div>
          <div><strong>CIN:</strong> ${state.cin}</div>
          <div><strong>Boundary Level:</strong> ${res.boundary_level}</div>
          <div><strong>Installation:</strong> ${res.installation_name}</div>
          <div><strong>Financial Year:</strong> ${res.financial_year}</div>
          <div><strong>Assurance Standard:</strong> Reasonable Assurance Standard</div>
        </div>

        <h3>Principle 6: Essential Indicators — Energy & GHG Emissions</h3>
        <div class="report-table-wrapper">
          <table class="report-table">
            <thead>
              <tr>
                <th>Indicator Parameter</th>
                <th>FY 2025-26 Q4 Value</th>
                <th>Statutory Source & Reconciliation Trace</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Scope 1 Direct Emissions</strong></td>
                <td><strong>${res.scope1.emissions_tco2e.toFixed(4)} tCO₂e</strong></td>
                <td>IPCC AR5 100-yr GWP (0.002685 tCO₂e/L). Reconciled with CO₂-only (${res.scope1.co2_only_reference.toFixed(4)} tCO₂).</td>
              </tr>
              <tr>
                <td><strong>Scope 2 Purchased Electricity</strong></td>
                <td><strong>${res.scope2.emissions_tco2e.toFixed(4)} tCO₂e</strong></td>
                <td>CEA Baseline Database v22.0 Table B (0.675000 tCO₂/MWh). Electricity: ${res.scope2.quantity_mwh.toFixed(2)} MWh.</td>
              </tr>
              <tr>
                <td><strong>Total Energy Consumption</strong></td>
                <td><strong>${res.energy_total_gj.toFixed(2)} GJ</strong></td>
                <td>Diesel: ${res.scope1.energy_consumption_gj.toFixed(2)} GJ + Electricity: ${res.scope2.energy_consumption_gj.toFixed(2)} GJ.</td>
              </tr>
              <tr>
                <td><strong>Energy Intensity</strong></td>
                <td>${res.energy_intensity_gj_per_tonne.toFixed(4)} GJ / t</td>
                <td>Normalized per metric tonne of steel produced (${res.production_tonnes} t).</td>
              </tr>
              <tr>
                <td><strong>Total Water Withdrawal</strong></td>
                <td><strong>${res.water.withdrawal_kl.toLocaleString()} kL</strong></td>
                <td>Intensity: ${res.water.intensity_kl_per_tonne.toFixed(2)} kL / tonne. Source: GIDC third-party + groundwater.</td>
              </tr>
              <tr>
                <td><strong>Waste Recovery Percentage</strong></td>
                <td><strong>${res.waste.recovery_percentage.toFixed(1)}%</strong></td>
                <td>${res.waste.recycled_tonnes.toFixed(2)} tonnes recycled out of ${res.waste.total_tonnes.toFixed(2)} tonnes total waste.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="report-actions">
          <button class="btn-download" onclick="window.documentModal.downloadMockFile('SEBI_BRSR_Core_Report.pdf')">📥 Download SEBI BRSR Report</button>
          <button class="btn-secondary" onclick="window.print()">🖨️ Print Statement</button>
        </div>
      </div>
    `;
  }

  downloadMockFile(filename) {
    const dummyContent = `PURECHAIN AI — DEMONSTRATION ARTIFACT\nFile: ${filename}\nGenerated: ${new Date().toISOString()}\nStatus: Verified Demo Output\nThis is a presentation-mode generated statutory artifact from Purechain AI WhatsApp Simulator.`;
    const blob = new Blob([dummyContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

window.DocumentModal = DocumentModal;
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DocumentModal;
}

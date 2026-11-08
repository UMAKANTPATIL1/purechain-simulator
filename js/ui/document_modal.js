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
    }

    this.open(title, reportHtml);
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

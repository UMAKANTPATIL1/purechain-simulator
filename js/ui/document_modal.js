/**
 * Purechain AI — Document Modal & Report Viewer
 * Handles interactive document upload dialogs and statutory PDF/DOCX report previews.
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
        <button class="btn-select-doc">Select Document</button>
      </div>
    `).join("");

    const contentHtml = `
      <div class="upload-dialog-container">
        <div class="upload-dropzone" id="dropzoneEl">
          <div class="drop-icon">📁</div>
          <h3>Drag & Drop Activity Documents</h3>
          <p>Supports <strong>PDF, DOCX, XLSX, CSV, JPG, PNG</strong></p>
          <div class="upload-hint">Or click any verified sample document below to simulate instant ingestion & semantic OCR parsing:</div>
        </div>

        <div class="upload-progress-container hidden" id="uploadProgressContainer">
          <div class="upload-status-text" id="uploadStatusText">Uploading document...</div>
          <div class="upload-progress-bar">
            <div class="upload-progress-fill" id="uploadProgressFill" style="width: 0%"></div>
          </div>
        </div>

        <div class="sample-docs-section">
          <h4>Available Test Documents for ${workflow || 'All Workflows'}:</h4>
          <div class="sample-docs-grid">
            ${docsListHtml}
          </div>
        </div>
      </div>
    `;

    this.onDocSelectedCallback = onSelected;
    this.open(`Upload Activity Document — ${workflow}`, contentHtml);
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

  showReportPreview(type, data) {
    let title = "Statutory Report Preview";
    let reportHtml = "";

    if (type === "HARIYALI") {
      title = "HARIYALI GHG Assessment Report (ISO 14064 / GHG Protocol)";
      const res = data.calculation_result || HARIYALI_DATA.calculate(data);
      reportHtml = this.buildHariyaliReportHtml(data, res);
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

  buildHariyaliReportHtml(state, res) {
    return `
      <div class="report-paper">
        <div class="report-header">
          <div class="report-brand">
            <span class="report-badge">🌱 PURECHAIN HARIYALI</span>
            <h2>GREENHOUSE GAS EMISSIONS ASSESSMENT REPORT</h2>
            <div class="report-sub">Compliant with GHG Protocol Corporate Standard & ISO 14064-1</div>
          </div>
          <div class="report-qr">
            <div class="qr-box">DEMO<br>VERIFIED</div>
          </div>
        </div>

        <div class="report-meta-grid">
          <div><strong>Company:</strong> ${state.company_name}</div>
          <div><strong>Assessment ID:</strong> HAR-2026-03-${Math.floor(1000 + Math.random()*9000)}</div>
          <div><strong>Facility:</strong> ${state.location}</div>
          <div><strong>Reporting Period:</strong> ${state.month}</div>
          <div><strong>Product Output:</strong> ${state.production_tonnes} tonnes of ${state.product_name}</div>
          <div><strong>Generated Date:</strong> ${new Date().toLocaleDateString('en-GB')}</div>
        </div>

        <h3>1. Carbon Footprint Summary</h3>
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
              <td>Upstream Freight Transport</td>
              <td>₹${res.scope3.spend_inr.toLocaleString()}</td>
              <td>Spend-based GWP</td>
              <td><strong>${res.scope3.emissions_tco2e.toFixed(4)}</strong></td>
            </tr>` : ''}
            <tr class="total-row">
              <td colspan="4"><strong>TOTAL CARBON FOOTPRINT</strong></td>
              <td><strong>${res.total_emissions_tco2e.toFixed(4)} tCO₂e</strong></td>
            </tr>
          </tbody>
        </table>

        <h3>2. Intensity Metrics</h3>
        <div class="kpi-boxes">
          <div class="kpi-box">
            <span class="kpi-val">${res.carbon_intensity_tco2e_per_tonne.toFixed(4)}</span>
            <span class="kpi-lbl">tCO₂e / tonne Product</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-val">${Math.round(res.total_emissions_kg).toLocaleString()}</span>
            <span class="kpi-lbl">Total kg CO₂e</span>
          </div>
          <div class="kpi-box">
            <span class="kpi-val">100%</span>
            <span class="kpi-lbl">Audit Provenance Score</span>
          </div>
        </div>

        <div class="report-actions">
          <button class="btn-download" onclick="window.documentModal.downloadMockFile('Purechain_HARIYALI_Report.pdf')">📥 Download PDF Report</button>
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

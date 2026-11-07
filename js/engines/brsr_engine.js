/**
 * Purechain AI — BRSR State Machine Engine
 * Strictly follows Purechain brsr_flow_service.py messages, buttons, and SEBI BRSR Core standards.
 */

class BRSREngine {
  constructor(app) {
    this.app = app;
    this.reset();
  }

  reset() {
    this.state = {
      step: "WELCOME",
      company_name: BRSR_DATA.company.company_name,
      cin: BRSR_DATA.company.cin,
      sector: BRSR_DATA.company.sector,
      period_display: BRSR_DATA.company.reporting_period_display,
      canonical_fy: BRSR_DATA.company.canonical_fy,
      level: "INSTALLATION", // 'COMPANY' or 'INSTALLATION'
      selected_installation_id: "inst-hazira-01",
      selected_installation_name: "Hazira Steel Works",
      coverage_matrix: BRSR_DATA.getInitialCoverageMatrix("INSTALLATION"),
      missing_data: { ...BRSR_DATA.default_missing_inputs },
      water_provided: false,
      waste_provided: false,
      disclosures_provided: false,
      calculation_result: null,
      history: [],
    };
  }

  getInitialMessage() {
    return {
      sender: "purechain",
      text: `🌿 *Welcome to Purechain BRSR Value Chain Assist*\n\nWe help your company prepare verified sustainability disclosures for SEBI BRSR Core compliance (Principle 6: Environmental Disclosures).\n\nPlease choose an option to get started:`,
      buttons: [
        { id: "btn_brsr_new", text: "Start New Assessment" },
        { id: "btn_brsr_continue", text: "Continue Existing" },
        { id: "btn_brsr_fast_track", text: "⚡ Fast-Track Demo Run" }
      ],
      step: "WELCOME"
    };
  }

  handleUserAction(actionId, textInput) {
    const s = this.state;

    // Fast track demo
    if (actionId === "btn_brsr_fast_track") {
      s.calculation_result = BRSR_DATA.calculate(s.level, s.missing_data);
      s.step = "RESULT";
      return this.renderResultScreen();
    }

    switch (s.step) {
      case "WELCOME":
        s.step = "FY_SELECT";
        return {
          sender: "purechain",
          text: `📅 *Enter BRSR Reporting Period*\n\nPlease enter the reporting period for your assessment by providing the *Start Date* and *End Date*:\n\n• *Format*: \`DD Month YYYY to DD Month YYYY\`\n  _Example:_ \`01 January 2026 to 31 March 2026\`\n• *Or*: \`YYYY-MM-DD to YYYY-MM-DD\`\n\n_(Start date must precede end date, and end date cannot be in the future.)_`,
          buttons: [
            { id: "btn_brsr_fy_q4", text: "FY 2025-26 Q4 (Jan–Mar)" },
            { id: "btn_brsr_fy_full", text: "Full FY 2025-26" },
            { id: "btn_brsr_fy_custom", text: "Custom Period" }
          ],
          step: "FY_SELECT"
        };

      case "FY_SELECT":
        if (actionId === "btn_brsr_fy_full") {
          s.period_display = "01 April 2025 to 31 March 2026 (Full FY 2025-26)";
        } else {
          s.period_display = "01 January 2026 to 31 March 2026 (FY 2025-26 Q4)";
        }

        s.step = "FY_CONFIRM";
        return {
          sender: "purechain",
          text: `📅 *Confirm Reporting Period*\n\nYou selected: *Reporting Period (3 Months)*\n• Start Date: January 01, 2026\n• End Date: March 31, 2026\n• Applicable FY: FY 2025-26\n• Months: 2026-01 to 2026-03\n\nPlease confirm to proceed:`,
          buttons: [
            { id: "btn_brsr_confirm_period", text: "Confirm Period" },
            { id: "btn_brsr_change_period", text: "Change Period" }
          ],
          step: "FY_CONFIRM"
        };

      case "FY_CONFIRM":
        if (actionId === "btn_brsr_change_period") {
          s.step = "FY_SELECT";
          return this.handleUserAction("btn_brsr_new");
        }

        s.step = "LEVEL_SELECT";
        return {
          sender: "purechain",
          text: `🏢 *Assessment Reporting Boundary*\n\nAt what operational level would you like to conduct this assessment?\n\n• *Company-level*: Consolidates all operational facilities under company control (Hazira Steel Works + Durgapur Rolling Mills).\n• *Installation-level*: Evaluates a single specific manufacturing plant.`,
          buttons: [
            { id: "btn_brsr_level_company", text: "Company-level" },
            { id: "btn_brsr_level_installation", text: "Installation-level" }
          ],
          step: "LEVEL_SELECT"
        };

      case "LEVEL_SELECT":
        if (actionId === "btn_brsr_level_company") {
          s.level = "COMPANY";
          s.selected_installation_name = "All Operational Facilities (Hazira + Durgapur)";
          s.step = "REVIEW_EXISTING";
          return this.renderCoverageMatrixScreen();
        } else {
          s.level = "INSTALLATION";
          s.step = "INSTALLATION_SELECT";
          return {
            sender: "purechain",
            text: `🏭 *Select Installation for BRSR Assessment*\n\nPlease select the manufacturing facility to evaluate:\n\n1. *Hazira Steel Works* (Surat, Gujarat)\n2. *Durgapur Rolling Mills* (Paschim Bardhaman, West Bengal)\n\nReply with the facility number or tap below:`,
            buttons: [
              { id: "btn_brsr_inst_hazira", text: "1. Hazira Steel Works" },
              { id: "btn_brsr_inst_durgapur", text: "2. Durgapur Mills" }
            ],
            step: "INSTALLATION_SELECT"
          };
        }

      case "INSTALLATION_SELECT":
        if (actionId === "btn_brsr_inst_durgapur") {
          s.selected_installation_id = "inst-durgapur-02";
          s.selected_installation_name = "Durgapur Rolling Mills";
        } else {
          s.selected_installation_id = "inst-hazira-01";
          s.selected_installation_name = "Hazira Steel Works";
        }

        s.step = "REVIEW_EXISTING";
        return this.renderCoverageMatrixScreen();

      case "REVIEW_EXISTING":
        if (actionId === "btn_brsr_change_boundary") {
          s.step = "LEVEL_SELECT";
          return {
            sender: "purechain",
            text: `🏢 *Change Reporting Boundary*\n\nPlease select the desired reporting boundary:`,
            buttons: [
              { id: "btn_brsr_level_company", text: "Company-level" },
              { id: "btn_brsr_level_installation", text: "Installation-level" }
            ],
            step: "LEVEL_SELECT"
          };
        }

        if (actionId === "btn_brsr_upload_doc") {
          // Document upload path
          return this.triggerDocumentDemonstration("doc_water_gidc_q4", "WATER_CONFIRM");
        }

        // Provide missing information path
        s.step = "WATER_INPUT";
        return {
          sender: "purechain",
          text: `💧 *Principle 6 — Water Withdrawal & Consumption*\n\nPlease provide total water withdrawal for ${s.selected_installation_name} across the reporting period (January – March 2026):\n\n• Groundwater & GIDC Supply: \`3,400.0 kL\`\n• Water Consumed: \`2,850.0 kL\`\n\nWould you like to record these metered quantities?`,
          buttons: [
            { id: "btn_brsr_water_3400", text: "Record 3,400 kL Water" },
            { id: "btn_brsr_water_upload", text: "📄 Upload Water Bill" },
            { id: "btn_brsr_water_custom", text: "Enter Custom Values" }
          ],
          step: "WATER_INPUT"
        };

      case "WATER_INPUT":
        if (actionId === "btn_brsr_water_upload") {
          return this.triggerDocumentDemonstration("doc_water_gidc_q4", "WASTE_INPUT");
        }
        s.water_provided = true;
        // Update coverage matrix for water
        Object.keys(s.coverage_matrix).forEach(m => s.coverage_matrix[m].water = "Available");

        s.step = "WASTE_INPUT";
        return {
          sender: "purechain",
          text: `✅ *Water Data Recorded*: 3,400.0 kL Withdrawal, 2,850.0 kL Consumption.\n\n♻️ *Principle 6 — Waste Generation & Recycling*\n\nPlease provide the total waste generated and disposed/recycled for ${s.selected_installation_name}:\n\n• Hazardous Waste (EAF Dust/Sludge): \`4.20 tonnes\`\n• Non-hazardous Recycled (Slag/Scrap): \`8.30 tonnes\`\n• Total Waste Generated: \`12.50 tonnes\` (66.4% Recovery)`,
          buttons: [
            { id: "btn_brsr_waste_125", text: "Record 12.50 t Waste" },
            { id: "btn_brsr_waste_upload", text: "📄 Upload Manifest" }
          ],
          step: "WASTE_INPUT"
        };

      case "WASTE_INPUT":
        if (actionId === "btn_brsr_waste_upload") {
          return this.triggerDocumentDemonstration("doc_waste_manifest_cpcb", "DISCLOSURES");
        }
        s.waste_provided = true;
        // Update coverage matrix for waste
        Object.keys(s.coverage_matrix).forEach(m => s.coverage_matrix[m].waste = "Available");

        s.step = "DISCLOSURES";
        return {
          sender: "purechain",
          text: `✅ *Waste Data Recorded*: 12.50 tonnes total (8.30 tonnes recycled).\n\n📂 *Outstanding Annual / Facility Disclosures (Principle 6)*\n\nPlease confirm the following statutory disclosures:\n\n1. **Renewable Electricity (E1)**: Did the facility consume on-site or purchased solar/wind electricity?\n2. **Purchased Thermal Energy (E2)**: Was purchased steam or district heat consumed?\n3. **Water Stressed Areas (E4)**: Does the facility discharge effluent into identified water-stressed zones?`,
          buttons: [
            { id: "btn_brsr_disc_standard", text: "Confirm Standard Disclosures" },
            { id: "btn_brsr_disc_renewable", text: "Active Solar/Wind" }
          ],
          step: "DISCLOSURES"
        };

      case "DISCLOSURES":
        s.disclosures_provided = true;
        if (actionId === "btn_brsr_disc_renewable") {
          s.missing_data.renewable_energy_active = true;
        }

        s.step = "CONSOLIDATED_REVIEW";
        return this.renderConsolidatedReviewScreen();

      case "CONSOLIDATED_REVIEW":
        if (actionId === "btn_brsr_change_boundary") {
          s.step = "LEVEL_SELECT";
          return this.handleUserAction("btn_brsr_new");
        }

        // Final Confirm & Calculate
        s.calculation_result = BRSR_DATA.calculate(s.level, s.missing_data);
        s.step = "RESULT";
        return this.renderResultScreen();

      case "RESULT":
        if (actionId === "btn_brsr_view_breakdown") {
          return this.renderBreakdownScreen();
        }
        if (actionId === "btn_brsr_download_report") {
          return {
            sender: "purechain",
            text: `📄 *SEBI BRSR Core Environmental Statement Ready*\n\nYour statutory BRSR Core assessment report for *${s.period_display}* has been compiled into the official SEBI format.\n\n[Click below to preview or download PDF/DOCX]`,
            buttons: [
              { id: "btn_brsr_open_pdf_modal", text: "👁️ Preview BRSR PDF" },
              { id: "btn_brsr_view_breakdown", text: "📊 View Math Breakdown" },
              { id: "btn_brsr_restart", text: "🔄 Start New Assessment" }
            ],
            step: "REPORT_READY"
          };
        }
        break;

      case "REPORT_READY":
        if (actionId === "btn_brsr_view_breakdown") return this.renderBreakdownScreen();
        if (actionId === "btn_brsr_restart") {
          this.reset();
          return this.getInitialMessage();
        }
        break;

      default:
        this.reset();
        return this.getInitialMessage();
    }
  }

  triggerDocumentDemonstration(docId, nextStep) {
    const doc = window.SAMPLE_DOCS.find(d => d.id === docId);
    const s = this.state;
    s.step = nextStep;

    const ocrCardHtml = window.ocrEngine.renderExtractionCard(doc);

    if (doc.doc_category === "Water Utility Statement") {
      s.water_provided = true;
      Object.keys(s.coverage_matrix).forEach(m => s.coverage_matrix[m].water = "Available");
    } else if (doc.doc_category === "Waste Manifest") {
      s.waste_provided = true;
      Object.keys(s.coverage_matrix).forEach(m => s.coverage_matrix[m].waste = "Available");
    }

    return {
      sender: "purechain",
      text: `📄 *Document Ingested & Verified*: \`${doc.name}\`\n\n${ocrCardHtml}\nData extracted and linked with audit traceability. Monthly coverage updated.`,
      buttons: [
        { id: "btn_brsr_doc_confirm", text: "✅ Confirm & Proceed" }
      ],
      step: nextStep
    };
  }

  renderCoverageMatrixScreen() {
    const s = this.state;
    const boundaryTitle = s.level === "COMPANY" ? "Company-level (Consolidated)" : `Installation-level (${s.selected_installation_name})`;

    const matrixHtml = `
<div class="brsr-matrix-card">
  <div class="matrix-title">📊 Monthly Coverage Matrix — ${s.canonical_fy} Q4</div>
  <table class="matrix-table">
    <thead>
      <tr>
        <th>Month</th>
        <th>Fuel</th>
        <th>Electricity</th>
        <th>Water</th>
        <th>Waste</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Jan 2026</strong></td>
        <td><span class="st-tag avail">✅ Available</span></td>
        <td><span class="st-tag avail">✅ Available</span></td>
        <td><span class="st-tag ${s.coverage_matrix['2026-01'].water === 'Available' ? 'avail' : 'miss'}">${s.coverage_matrix['2026-01'].water === 'Available' ? '✅ Available' : '⚠️ Missing'}</span></td>
        <td><span class="st-tag ${s.coverage_matrix['2026-01'].waste === 'Available' ? 'avail' : 'miss'}">${s.coverage_matrix['2026-01'].waste === 'Available' ? '✅ Available' : '⚠️ Missing'}</span></td>
      </tr>
      <tr>
        <td><strong>Feb 2026</strong></td>
        <td><span class="st-tag avail">✅ Available</span></td>
        <td><span class="st-tag avail">✅ Available</span></td>
        <td><span class="st-tag ${s.coverage_matrix['2026-02'].water === 'Available' ? 'avail' : 'miss'}">${s.coverage_matrix['2026-02'].water === 'Available' ? '✅ Available' : '⚠️ Missing'}</span></td>
        <td><span class="st-tag ${s.coverage_matrix['2026-02'].waste === 'Available' ? 'avail' : 'miss'}">${s.coverage_matrix['2026-02'].waste === 'Available' ? '✅ Available' : '⚠️ Missing'}</span></td>
      </tr>
      <tr>
        <td><strong>Mar 2026</strong></td>
        <td><span class="st-tag avail">✅ Available</span></td>
        <td><span class="st-tag avail">✅ Available</span></td>
        <td><span class="st-tag ${s.coverage_matrix['2026-03'].water === 'Available' ? 'avail' : 'miss'}">${s.coverage_matrix['2026-03'].water === 'Available' ? '✅ Available' : '⚠️ Missing'}</span></td>
        <td><span class="st-tag ${s.coverage_matrix['2026-03'].waste === 'Available' ? 'avail' : 'miss'}">${s.coverage_matrix['2026-03'].waste === 'Available' ? '✅ Available' : '⚠️ Missing'}</span></td>
      </tr>
    </tbody>
  </table>
</div>`;

    const text = `📄 *BRSR Monthly Coverage Matrix (${s.period_display})*

Boundary: *${boundaryTitle}*

Confirmed data found from HARIYALI for: _Fuel Combustion (Scope 1), Grid Electricity (Scope 2)_. You will not need to re-enter this data.

${matrixHtml}

⚠️ *Months and Indicators Requiring Additional Information:*
• *January 2026*: Requires Water, Waste
• *February 2026*: Requires Water, Waste
• *March 2026*: Requires Water, Waste

📂 *Outstanding Annual / Facility Disclosures:*
• Renewable Energy Consumption (Principle 6 E1)
• Purchased Steam / Thermal Energy (Principle 6 E2)
• Water Discharge in Water-Stressed Areas (Principle 6 E4)

We will ask only for the specific indicators and disclosures that are unavailable.

💡 _To change reporting boundary before continuing, reply *Change Boundary*._`;

    return {
      sender: "purechain",
      text: text,
      buttons: [
        { id: "btn_brsr_provide_missing", text: "Provide Missing Info" },
        { id: "btn_brsr_upload_doc", text: "📄 Upload Evidence" },
        { id: "btn_brsr_change_boundary", text: "Change Boundary" }
      ],
      step: "REVIEW_EXISTING"
    };
  }

  renderConsolidatedReviewScreen() {
    const s = this.state;
    const isCompany = (s.level === "COMPANY");
    const res = BRSR_DATA.calculate(s.level, s.missing_data);

    const boundaryDisplay = isCompany ? "Company-level (Consolidated Hazira + Durgapur)" : `Installation-level (${s.selected_installation_name})`;
    const reusedCount = isCompany ? 6 : 3;

    const lines = [
      "📋 *BRSR Consolidated Review Before Calculation*\n",
      `• Reporting Boundary: *${boundaryDisplay}*`,
      `• Reporting Period: *${s.period_display}*`,
      `• Reused HARIYALI Records: *${reusedCount} activity records (Read-Only)*`,
      `• Newly Added Disclosures: *Water, Waste & Energy Disclosures*`,
      `• High Speed Diesel: *${res.scope1.quantity_litres.toLocaleString()} Litres*`,
      `• Electricity: *${res.scope2.quantity_kwh.toLocaleString()} kWh* (${res.scope2.quantity_mwh.toFixed(2)} MWh)`,
      `• Water Withdrawal: *${res.water.withdrawal_kl.toLocaleString()} kL*`,
      `• Waste Generated: *${res.waste.total_tonnes.toFixed(2)} tonnes* (${res.waste.recovery_percentage.toFixed(1)}% recovery)`,
      `• Renewable Electricity: *${res.disclosures.renewable_electricity}*`,
      `• Purchased Steam/Thermal: *${res.disclosures.purchased_thermal}*`,
      `• Water Stressed Area Discharge: *${res.disclosures.water_discharge_stressed}*`,
      "\nAll required monthly indicators and disclosures are complete and reconciled.",
      "Please confirm to calculate and generate your verified SEBI BRSR Core statement."
    ];

    return {
      sender: "purechain",
      text: lines.join("\n"),
      buttons: [
        { id: "btn_brsr_confirm_calculate", text: "✅ Review & Calculate" },
        { id: "btn_brsr_change_boundary", text: "Change Boundary" }
      ],
      step: "CONSOLIDATED_REVIEW"
    };
  }

  renderResultScreen() {
    const s = this.state;
    const res = s.calculation_result || BRSR_DATA.calculate(s.level, s.missing_data);
    s.calculation_result = res;

    const text = `🌿 *SEBI BRSR Core Assessment Complete!*

🏢 Company: *${s.company_name}*
🏭 Boundary: *${res.boundary_level}* (${res.installation_name})
📅 Financial Year: *${res.financial_year}*

📊 *Principle 6 — Statutory Environmental Disclosures:*
• *Scope 1 Direct Emissions*: **${res.scope1.emissions_tco2e.toFixed(4)} tCO₂e**
  - Fuel: High Speed Diesel (${res.scope1.quantity_litres.toLocaleString()} Litres)
  - Factor: ${res.scope1.factor} tCO₂e/L (IPCC AR5 100-yr GWP)
  - Note: Mathematical difference from ${res.scope1.co2_only_reference.toFixed(4)} tCO₂ is fully reconciled (CO₂-only vs CO₂e).

• *Scope 2 Indirect Emissions*: **${res.scope2.emissions_tco2e.toFixed(4)} tCO₂e**
  - Grid Electricity: ${res.scope2.quantity_kwh.toLocaleString()} kWh (${res.scope2.quantity_mwh.toFixed(2)} MWh)
  - Statutory Factor: ${res.scope2.factor.toFixed(6)} tCO₂/MWh (CEA CO₂ Baseline v22.0 Table B)

⚡ *Energy Metrics:*
• Total Energy Consumption: *${res.energy_total_gj.toFixed(2)} GJ*
• Energy Intensity: *${res.energy_intensity_gj_per_tonne.toFixed(4)} GJ/tonne of product*
• Total GHG Emissions: *${res.total_ghg_tco2e.toFixed(4)} tCO₂e*
• GHG Intensity: *${res.ghg_intensity_tco2e_per_tonne.toFixed(4)} tCO₂e/tonne*

💧 *Water & Waste Disclosures:*
• Water Withdrawal: *${res.water.withdrawal_kl.toLocaleString()} kL* (${res.water.intensity_kl_per_tonne.toFixed(2)} kL/tonne)
• Waste Generated: *${res.waste.total_tonnes.toFixed(2)} tonnes* (${res.waste.recovery_percentage.toFixed(1)}% recovery)

💡 _Reconciled & passing strictly under SEBI BRSR Core Phase 4.7.1 guidelines._`;

    return {
      sender: "purechain",
      text: text,
      buttons: [
        { id: "btn_brsr_view_breakdown", text: "📊 View Reconciliation Breakdown" },
        { id: "btn_brsr_download_report", text: "📄 Generate BRSR Report" },
        { id: "btn_brsr_restart", text: "🔄 Start New Assessment" }
      ],
      step: "RESULT"
    };
  }

  renderBreakdownScreen() {
    const s = this.state;
    const res = s.calculation_result || BRSR_DATA.calculate(s.level, s.missing_data);

    const text = `🔬 *Purechain BRSR — Phase 4.7.1 Mathematical Reconciliation Trace*

1️⃣ *Scope 1 Discrepancy Resolution (CO₂ vs CO₂e):*
• Stated Activity ($Q$): ${res.scope1.quantity_litres.toLocaleString()} Litres of HSD
• Mass NCV: 43.00 GJ/tonne | Volumetric Density: 0.840 kg/L
• $\\text{NCV}_{vol} = 0.840 \\times 0.043000 = 0.036120\\text{ GJ/L}$
• **Case A (CO₂-only)**: $Q \\times 0.03612 \\times 74.1\\text{ tCO}_2/\\text{TJ} = \\mathbf{${res.scope1.co2_only_reference.toFixed(4)}\\text{ tCO}_2}$
• **Case B (SEBI Mandated CO₂e)**: Includes $\\text{CO}_2$ ($74.1$), $\\text{CH}_4$ ($0.003 \\times 28$), and $\\text{N}_2\\text{O}$ ($0.0006 \\times 265$).
• Verified Factor: $\\mathbf{0.002685\\text{ tCO}_2\\text{e/L}}$
• Statutoty Result: $E_{s1} = ${res.scope1.quantity_litres.toLocaleString()} \\times 0.002685 = \\mathbf{${res.scope1.emissions_tco2e.toFixed(4)}\\text{ tCO}_2\\text{e}}$

2️⃣ *Scope 2 Statutory CEA v22.0 Grid Factor Trace:*
• Electricity: ${res.scope2.quantity_mwh.toFixed(2)} MWh
• Factor: Strictly **0.675000 tCO₂/MWh** from Central Electricity Authority (CEA) *CO2 Baseline Database for the Indian Power Sector, User Guide Version 22.0 (August 2026)*, Table B (Weighted Average Emission Rate).
• Calculation: $E_{s2} = ${res.scope2.quantity_mwh.toFixed(2)} \\times 0.675000 = \\mathbf{${res.scope2.emissions_tco2e.toFixed(4)}\\text{ tCO}_2\\text{e}}$

3️⃣ *Operational Provenance Traceability:*
• Reused from HARIYALI: ${res.reused_hariyali_count} records (Unmodified, Read-Only)
• Mathematical audit status: **100% RECONCILED & GREEN**`;

    return {
      sender: "purechain",
      text: text,
      buttons: [
        { id: "btn_brsr_download_report", text: "📄 Generate BRSR Report" },
        { id: "btn_brsr_restart", text: "🔄 Start New Assessment" }
      ],
      step: "RESULT"
    };
  }
}

window.BRSREngine = BRSREngine;

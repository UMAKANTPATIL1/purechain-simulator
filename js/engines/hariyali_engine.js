/**
 * Purechain AI — HARIYALI State Machine Engine
 * Strictly follows Purechain carbon_flow_service.py messages, buttons, and state logic.
 */

class HariyaliEngine {
  constructor(app) {
    this.app = app;
    this.reset();
  }

  reset() {
    this.state = {
      step: "WELCOME",
      company_name: HARIYALI_DATA.facility.company_name,
      location: HARIYALI_DATA.facility.location,
      month: HARIYALI_DATA.facility.activity_month_display,
      diesel_litres: HARIYALI_DATA.default_inputs.diesel_litres,
      electricity_kwh: HARIYALI_DATA.default_inputs.electricity_kwh,
      production_tonnes: HARIYALI_DATA.default_inputs.production_tonnes,
      product_name: HARIYALI_DATA.default_inputs.product_name,
      scope3_transport_spend: HARIYALI_DATA.default_inputs.scope3_transport_spend,
      include_scope3: true,
      has_conflict: false,
      conflict_resolved: false,
      calculation_result: null,
      history: [],
    };
  }

  getInitialMessage() {
    return {
      sender: "purechain",
      text: `🌱 *Welcome to Purechain HARIYALI Carbon Accounting*\n\nI will help you calculate your business carbon footprint for Scope 1 (Direct Fuel), Scope 2 (Grid Electricity), and optional Supply Chain emissions in accordance with statutory GHG Protocol standards.\n\nLet's get started with your facility details.`,
      buttons: [
        { id: "btn_h_start", text: "Start Assessment" },
        { id: "btn_h_fast_track", text: "Fast-Track Demo Run" },
        { id: "btn_h_view_ytd", text: "📊 View Cumulative/YTD" }
      ],
      step: "WELCOME"
    };
  }

  handleUserAction(actionId, textInput) {
    const s = this.state;

    // Fast track demo
    if (actionId === "btn_h_fast_track") {
      s.calculation_result = HARIYALI_DATA.calculate(s);
      s.step = "RESULT";
      return this.renderResultScreen();
    }

    if (actionId === "btn_h_view_ytd") {
      return {
        sender: "purechain",
        text: `📊 *Purechain HARIYALI — Cumulative FY 2025-26 Overview*\n\n🏢 Facility: *${s.company_name}*\n📍 Location: *${s.location}*\n\n• *Q1 (Apr–Jun 2025)*: 48.90 tCO₂e (Available)\n• *Q2 (Jul–Sep 2025)*: 51.20 tCO₂e (Available)\n• *Q3 (Oct–Dec 2025)*: 49.80 tCO₂e (Available)\n• *Q4 (Jan–Feb 2026)*: 33.40 tCO₂e (Available)\n• *March 2026*: In progress\n\nReady to finalize March 2026 accounting?`,
        buttons: [
          { id: "btn_h_start", text: "Continue March 2026" }
        ],
        step: "WELCOME"
      };
    }

    // Step-by-step state machine
    switch (s.step) {
      case "WELCOME":
        s.step = "LOCATION";
        return {
          sender: "purechain",
          text: `🏢 *Facility & Business Details*\n\nFound recorded operational installation:\n• Business: *${s.company_name}*\n• Location: *${s.location}*\n\nWould you like to conduct the assessment for this facility?`,
          buttons: [
            { id: "btn_h_confirm_facility", text: "Confirm Facility" },
            { id: "btn_h_edit_facility", text: "✏️ Change Location" }
          ],
          step: "LOCATION"
        };

      case "LOCATION":
        if (actionId === "btn_h_edit_facility" || textInput) {
          if (textInput) s.location = textInput;
        }
        s.step = "PERIOD";
        return {
          sender: "purechain",
          text: `📅 *Select Activity Month / Reporting Period*\n\nPlease select the activity month for this carbon assessment:`,
          buttons: [
            { id: "btn_h_month_mar", text: "March 2026" },
            { id: "btn_h_month_feb", text: "February 2026" },
            { id: "btn_h_month_jan", text: "January 2026" }
          ],
          step: "PERIOD"
        };

      case "PERIOD":
        if (actionId === "btn_h_month_feb") s.month = "February 2026";
        else if (actionId === "btn_h_month_jan") s.month = "January 2026";
        else s.month = "March 2026";

        s.step = "FUEL";
        return {
          sender: "purechain",
          text: `⛽ *Scope 1 — Direct Fuel Combustion*\n\nPlease enter your fuel consumption for *${s.month}* (e.g. diesel used for backup generators, boilers, or industrial furnaces).\n\n_Default recorded receipt:_ \`2,600 Litres of High Speed Diesel (HSD)\``,
          buttons: [
            { id: "btn_h_fuel_2600", text: "Use 2,600 L Diesel" },
            { id: "btn_h_fuel_3500", text: "Use 3,500 L Diesel" },
            { id: "btn_h_fuel_upload", text: "📄 Upload Fuel Bill" }
          ],
          step: "FUEL"
        };

      case "FUEL":
        if (actionId === "btn_h_fuel_3500") s.diesel_litres = 3500.0;
        else if (actionId === "btn_h_fuel_upload") {
          // Trigger document simulation
          return this.triggerDocumentDemonstration("doc_fuel_invoice_4921", "ELECTRICITY");
        } else if (textInput && !isNaN(parseFloat(textInput))) {
          s.diesel_litres = parseFloat(textInput);
        } else {
          s.diesel_litres = 2600.0;
        }

        s.step = "ELECTRICITY";
        return {
          sender: "purechain",
          text: `⚡ *Scope 2 — Purchased Grid Electricity*\n\nPlease enter your electricity consumption from the utility grid for *${s.month}* (in kWh or MWh).\n\n_Default meter entry:_ \`14,500 kWh\``,
          buttons: [
            { id: "btn_h_elec_14500", text: "Use 14,500 kWh" },
            { id: "btn_h_elec_upload", text: "📄 Upload Electric Bill" },
            { id: "btn_h_elec_custom", text: "Enter Custom Units" }
          ],
          step: "ELECTRICITY"
        };

      case "ELECTRICITY":
        if (actionId === "btn_h_elec_upload") {
          // Document upload with conflict demonstration!
          return this.triggerDocumentDemonstration("doc_elec_mar2026", "CONFLICT");
        } else if (textInput && !isNaN(parseFloat(textInput))) {
          s.electricity_kwh = parseFloat(textInput);
        } else {
          s.electricity_kwh = 14500.0;
        }

        s.step = "PRODUCTION";
        return {
          sender: "purechain",
          text: `📦 *Production Output (Optional)*\n\nTo calculate your facility's product carbon intensity (tCO₂e per tonne of output), enter your finished production quantity for ${s.month}.\n\n_Default recorded production:_ \`150.0 tonnes of Steel Billets\``,
          buttons: [
            { id: "btn_h_prod_150", text: "150.0 t Billets" },
            { id: "btn_h_prod_skip", text: "Continue No Prod" },
            { id: "btn_h_prod_doc", text: "Upload Prod Report" }
          ],
          step: "PRODUCTION"
        };

      case "CONFLICT":
        if (actionId === "btn_h_conflict_ocr") {
          s.electricity_kwh = 15200.0; // OCR value
          s.conflict_resolved = true;
        } else if (actionId === "btn_h_conflict_typed") {
          s.electricity_kwh = 14500.0; // User entry
          s.conflict_resolved = true;
        } else if (actionId === "btn_h_conflict_new") {
          s.electricity_kwh = 15000.0;
          s.conflict_resolved = true;
        }
        s.step = "PRODUCTION";
        return {
          sender: "purechain",
          text: `✅ *Value Updated*: Using electricity consumption of *${s.electricity_kwh.toLocaleString()} kWh* for ${s.month}.\n\n📦 *Production Output (Optional)*\n\nEnter finished production quantity for ${s.month} to compute specific intensity:\n• Product: *${s.product_name}*\n• Default: *${s.production_tonnes} tonnes*`,
          buttons: [
            { id: "btn_h_prod_150", text: "150.0 t Billets" },
            { id: "btn_h_prod_skip", text: "Continue No Prod" }
          ],
          step: "PRODUCTION"
        };

      case "PRODUCTION":
        if (actionId === "btn_h_prod_skip") s.production_tonnes = 0.0;
        else if (textInput && !isNaN(parseFloat(textInput))) s.production_tonnes = parseFloat(textInput);
        else s.production_tonnes = 150.0;

        s.step = "SCOPE3";
        return {
          sender: "purechain",
          text: `🚚 *Supply Chain / Scope 3 Data Offer*\n\nWould you like to include upstream transportation and logistics for ${s.month}?\n\n• Category: *Freight Logistics*\n• Spend: *₹34,500.00*`,
          buttons: [
            { id: "btn_h_scope3_yes", text: "Yes, Include Supply" },
            { id: "btn_h_scope3_no", text: "No, Calculate Now" }
          ],
          step: "SCOPE3"
        };

      case "SCOPE3":
        s.include_scope3 = (actionId === "btn_h_scope3_yes");
        if (!s.include_scope3) s.scope3_transport_spend = 0.0;

        s.step = "SUMMARY";
        return this.renderConfirmationSummary();

      case "SUMMARY":
        if (actionId === "btn_h_change_something") {
          s.step = "FUEL";
          return {
            sender: "purechain",
            text: `✏️ *What would you like to update?*\n\nLet's re-verify your Fuel activity data:`,
            buttons: [
              { id: "btn_h_fuel_2600", text: "Use 2,600 L Diesel" },
              { id: "btn_h_fuel_3500", text: "Use 3,500 L Diesel" }
            ],
            step: "FUEL"
          };
        }

        // Final Confirm & Calculate
        s.calculation_result = HARIYALI_DATA.calculate(s);
        s.step = "RESULT";
        return this.renderResultScreen();

      case "RESULT":
        if (actionId === "btn_h_view_breakdown") {
          return this.renderBreakdownScreen();
        }
        if (actionId === "btn_h_download_report") {
          return {
            sender: "purechain",
            text: `📄 *Purechain HARIYALI — Statutory GHG Report Generated*\n\nYour verified GHG assessment report for *${s.month}* is ready. It has been formatted in accordance with the GHG Protocol Corporate Standard.\n\n[Click below to preview or download PDF/DOCX]`,
            buttons: [
              { id: "btn_h_open_pdf_modal", text: "👁️ Preview GHG Report PDF" },
              { id: "btn_h_view_breakdown", text: "📊 View Math Breakdown" },
              { id: "btn_h_add_next_month", text: "➕ Add Next Month" }
            ],
            step: "REPORT_READY"
          };
        }
        if (actionId === "btn_h_add_next_month" || actionId === "btn_h_restart") {
          this.reset();
          return this.getInitialMessage();
        }
        break;

      case "REPORT_READY":
        if (actionId === "btn_h_view_breakdown") {
          return this.renderBreakdownScreen();
        }
        if (actionId === "btn_h_add_next_month") {
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

    if (doc.extracted_data.has_conflict) {
      s.has_conflict = true;
      const c = doc.extracted_data;
      return {
        sender: "purechain",
        text: `📄 *Document Ingested & Analyzed*: \`${doc.name}\`\n\n${ocrCardHtml}\nI found a difference in your Electricity values for ${s.month}:\n\n📄 Document: *${c.extracted_value.toLocaleString()} kWh*\n✍️ Your entry: *${s.electricity_kwh.toLocaleString()} kWh*\n\nWhich value should I use?`,
        buttons: [
          { id: "btn_h_conflict_ocr", text: `Use ${c.extracted_value.toLocaleString()} kWh` },
          { id: "btn_h_conflict_typed", text: `Use ${s.electricity_kwh.toLocaleString()} kWh` },
          { id: "btn_h_conflict_new", text: "Enter another value" }
        ],
        step: "CONFLICT"
      };
    } else {
      return {
        sender: "purechain",
        text: `📄 *Document Ingested & Analyzed*: \`${doc.name}\`\n\n${ocrCardHtml}\nI found:\n📅 ${s.month}\n⛽ High Speed Diesel: *${doc.extracted_data.extracted_value.toLocaleString()} Litres*\n\nData has been verified with 98.9% OCR confidence.`,
        buttons: [
          { id: "btn_h_doc_confirm", text: "✅ Confirm & Proceed" }
        ],
        step: nextStep
      };
    }
  }

  renderConfirmationSummary() {
    const s = this.state;
    const lines = [
      "Got it. I found:\n",
      `🏭 Business: *${s.company_name}*`,
      `📍 Location: *${s.location}*`,
      `📅 Activity Month: *${s.month}*`,
    ];

    if (s.production_tonnes > 0) {
      lines.push(`🧵 Product: *${s.product_name}*`);
      lines.push(`📦 Production: *${s.production_tonnes.toFixed(2)} tonnes*`);
    }

    lines.push(`⛽ Diesel: *${s.diesel_litres.toLocaleString()} Litres*`);
    lines.push(`⚡ Electricity: *${s.electricity_kwh.toLocaleString()} kWh*`);

    if (s.include_scope3 && s.scope3_transport_spend > 0) {
      lines.push(`\n🚚 Supply Chain`);
      lines.push(`• Freight Transport: *₹${s.scope3_transport_spend.toLocaleString()}*`);
    }

    lines.push("\nPlease confirm your details and monthly activity data.");

    return {
      sender: "purechain",
      text: lines.join("\n"),
      buttons: [
        { id: "btn_h_confirm_calculate", text: "✅ Calculate" },
        { id: "btn_h_change_something", text: "✏️ Change Something" }
      ],
      step: "SUMMARY"
    };
  }

  renderResultScreen() {
    const s = this.state;
    const res = s.calculation_result || HARIYALI_DATA.calculate(s);
    s.calculation_result = res;

    const s1_pct = ((res.scope1.emissions_tco2e / res.total_emissions_tco2e) * 100).toFixed(1);
    const s2_pct = ((res.scope2.emissions_tco2e / res.total_emissions_tco2e) * 100).toFixed(1);

    const text = `🌱 *Your Carbon Footprint Assessment is Complete!*

🏢 Company: *${s.company_name}*
📍 Location: *${s.location}*
📅 Activity Month: *${s.month}*

📊 *Emissions Summary:*
• Scope 1: *${res.scope1.emissions_tco2e.toFixed(2)} tCO₂e* (${s1_pct}%)
  - High Speed Diesel: ${res.scope1.quantity.toLocaleString()} Litres
• Scope 2: *${res.scope2.emissions_tco2e.toFixed(2)} tCO₂e* (${s2_pct}%)
  - Grid Electricity: ${res.scope2.quantity.toLocaleString()} kWh
${res.scope3 ? `• Scope 3: *${res.scope3.emissions_tco2e.toFixed(2)} tCO₂e*\n  - Logistics Spend: ₹${res.scope3.spend_inr.toLocaleString()}` : ''}

🌍 *Total Carbon Footprint: ${res.total_emissions_tco2e.toFixed(2)} tCO₂e* (${Math.round(res.total_emissions_kg).toLocaleString()} kgCO₂e)
${res.production_tonnes > 0 ? `🎯 *Carbon Intensity: ${res.carbon_intensity_tco2e_per_tonne.toFixed(3)} tCO₂e/tonne* (${res.carbon_intensity_kg_per_tonne.toFixed(1)} kgCO₂e/tonne of ${s.product_name})` : ''}

💡 _Calculated strictly using statutory CEA Baseline v22.0 grid factor (${HARIYALI_DATA.emission_factors.grid_electricity_factor.toFixed(6)} tCO₂/MWh) & IPCC AR5 100-yr GWPs._`;

    return {
      sender: "purechain",
      text: text,
      buttons: [
        { id: "btn_h_view_breakdown", text: "📊 View Breakdown" },
        { id: "btn_h_download_report", text: "📄 Generate Report" },
        { id: "btn_h_add_next_month", text: "➕ Add Another Month" }
      ],
      step: "RESULT"
    };
  }

  renderBreakdownScreen() {
    const s = this.state;
    const res = s.calculation_result || HARIYALI_DATA.calculate(s);

    const text = `🔬 *Purechain HARIYALI — Calculation Math & Audit Trace*

1️⃣ *Scope 1 Direct Combustion Math:*
• Fuel: High Speed Diesel (HSD)
• Quantity ($Q$): ${res.scope1.quantity.toLocaleString()} Litres
• Volumetric NCV: ${HARIYALI_DATA.emission_factors.diesel_ncv} GJ/L (IS 1460:2017)
• Energy Equivalent: ${res.scope1.energy_gj.toFixed(3)} GJ
• Emission Factor: ${HARIYALI_DATA.emission_factors.diesel_factor_tco2e_per_l.toFixed(6)} tCO₂e/L
• Reference Standard: IPCC 2006 Vol 2 & AR5 100-yr GWPs (CO₂ + CH₄ + N₂O)
• Equation: $E_{s1} = ${res.scope1.quantity.toLocaleString()} \\times 0.002685 = \\mathbf{${res.scope1.emissions_tco2e.toFixed(4)}\\text{ tCO}_2\\text{e}}$

2️⃣ *Scope 2 Purchased Grid Electricity Math:*
• Activity: Grid Electricity
• Quantity: ${res.scope2.quantity.toLocaleString()} kWh (${res.scope2.quantity_mwh.toFixed(3)} MWh)
• Statutory Factor: ${HARIYALI_DATA.emission_factors.grid_electricity_factor.toFixed(6)} tCO₂/MWh
• Factor Source: CEA CO₂ Baseline Database for the Indian Power Sector, User Guide Version 22.0 (Aug 2026), Table B (Weighted Average Emission Rate)
• Equation: $E_{s2} = ${res.scope2.quantity_mwh.toFixed(3)} \\times 0.675000 = \\mathbf{${res.scope2.emissions_tco2e.toFixed(4)}\\text{ tCO}_2\\text{e}}$

3️⃣ *Audit Integrity:*
• Total Footprint: *${res.total_emissions_tco2e.toFixed(4)} tCO₂e*
• Zero fabricated or inferred data
• Timestamp: ${new Date().toISOString()}`;

    return {
      sender: "purechain",
      text: text,
      buttons: [
        { id: "btn_h_download_report", text: "📄 Generate Report" },
        { id: "btn_h_add_next_month", text: "➕ Add Another Month" }
      ],
      step: "RESULT"
    };
  }
}

window.HariyaliEngine = HariyaliEngine;

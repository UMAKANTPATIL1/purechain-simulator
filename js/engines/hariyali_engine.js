/**
 * Purechain AI — HARIYALI State Machine Engine
 * Strictly follows Purechain carbon_flow_service.py messages, buttons, and state logic.
 *
 * Implements:
 * 1. Multi-installation resolution & facility selection / registration.
 * 2. Reporting period selection (FY 2025–26, FY 2024–25).
 * 3. Monthly data availability check:
 *    - Case A: 7 confirmed months available (April–October 2025)
 *    - Interactive options: View Monthly Data, Update Month, View Cumulative/YTD, Switch Facility.
 * 4. Personalized monthly activity collection prompt for next month (November 2025).
 * 5. Scope 1 Direct Fuel, Scope 2 Electricity (CEA v22.0: 0.675000 tCO2/MWh).
 * 6. Document upload & conflict resolution demonstration.
 * 7. Scope 3 supply chain offer prompt & buttons.
 * 8. Confirmation summary review.
 * 9. Authoritative assessment results (kg CO2e, tonnes CO2e, carbon intensity).
 * 10. Statutory GHG PDF report choice: All Available Monthly Data vs Current Calculation Only.
 */

class HariyaliEngine {
  constructor(app) {
    this.app = app;
    this.reset();
  }

  reset() {
    const inst = HARIYALI_DATA.installations[0];
    this.state = {
      step: "FACILITY_SELECT", // Initial entry state
      active_installation: inst,
      company_name: inst.company_name,
      facility_name: inst.installation_name,
      location: inst.location,
      reporting_period: HARIYALI_DATA.reporting_period,
      month: HARIYALI_DATA.next_month,
      diesel_litres: HARIYALI_DATA.default_inputs.diesel_litres,
      electricity_kwh: HARIYALI_DATA.default_inputs.electricity_kwh,
      production_tonnes: HARIYALI_DATA.default_inputs.production_tonnes,
      product_name: HARIYALI_DATA.default_inputs.product_name,
      scope3_transport_spend: HARIYALI_DATA.default_inputs.scope3_transport_spend,
      include_scope3: true,
      has_conflict: false,
      conflict_resolved: false,
      calculation_result: null,
      report_mode: "ALL_AVAILABLE",
      history: [],
    };
  }

  getInitialMessage() {
    const insts = HARIYALI_DATA.installations;
    const lines = [
      "🏢 *Select Manufacturing Facility*\n",
      "Please select which facility you would like to assess:\n",
    ];

    insts.forEach((inst, idx) => {
      lines.push(`${idx + 1}️⃣ *${inst.installation_name}* — ${inst.location}`);
    });

    lines.push("\n_Reply with the facility number/name, or tap below:_");

    return {
      sender: "purechain",
      text: lines.join("\n").trim(),
      buttons: [
        { id: `btn_select_facility:${insts[0].id}`, text: insts[0].installation_name },
        { id: `btn_select_facility:${insts[1].id}`, text: insts[1].installation_name },
        { id: "btn_add_new_facility", text: "➕ Add Facility" }
      ],
      step: "FACILITY_SELECT"
    };
  }

  handleUserAction(actionId, textInput) {
    const s = this.state;
    const cleanAction = (actionId || "").toLowerCase();

    // Fast-track demo shortcut
    if (cleanAction === "btn_h_fast_track") {
      s.calculation_result = HARIYALI_DATA.calculate(s);
      s.step = "RESULT";
      return this.renderResultScreen();
    }

    // Direct Switch Facility trigger
    if (cleanAction === "btn_switch_facility") {
      s.step = "FACILITY_SELECT";
      return this.getInitialMessage();
    }

    // Direct Add Facility trigger
    if (cleanAction === "btn_add_new_facility" || cleanAction === "btn_add_facility") {
      s.step = "REGISTRATION";
      return {
        sender: "purechain",
        text: `🌱 *Register Facility*\n\nPlease provide your facility details:\n1. Company / Legal Entity Name\n2. Facility Name\n3. Complete Address\n4. City\n5. State\n6. Country\n7. Industry / Sector\n\n_Example:_\nCompany: Acme Textiles Ltd\nFacility: Plant 2 (Ahmedabad)\nAddress: Plot 10, Sanand GIDC\nCity: Ahmedabad\nState: Gujarat\nCountry: India\nIndustry: Textiles`,
        buttons: [
          { id: "btn_reg_sample_plant", text: "Register Plant 2 (Ahmedabad)" },
          { id: "btn_cancel_reg", text: "❌ Cancel" }
        ],
        step: "REGISTRATION"
      };
    }

    // View Cumulative / YTD
    if (cleanAction === "btn_view_ytd") {
      s.step = "YTD_VIEW";
      return this.renderYtdView();
    }

    // View Record (last confirmed month)
    if (cleanAction === "btn_view_record") {
      s.step = "RECORD_VIEW";
      return this.renderExistingMonthRecord();
    }

    // Add Next Month
    if (cleanAction === "btn_add_month") {
      s.step = "COLLECTING";
      return this.renderPersonalizedCollectionPrompt();
    }

    // Step-by-step state machine
    switch (s.step) {
      case "FACILITY_SELECT": {
        if (cleanAction.includes("inst_surat_02")) {
          s.active_installation = HARIYALI_DATA.installations[1];
          s.facility_name = s.active_installation.installation_name;
          s.location = s.active_installation.location;
        } else {
          s.active_installation = HARIYALI_DATA.installations[0];
          s.facility_name = s.active_installation.installation_name;
          s.location = s.active_installation.location;
        }

        s.step = "PERIOD_SELECT";
        return {
          sender: "purechain",
          text: `Selected facility: *${s.facility_name}*\n\n📅 Please select your reporting financial year.`,
          buttons: [
            { id: "btn_reporting_period:FY 2025–26", text: "FY 2025–26" },
            { id: "btn_reporting_period:FY 2024–25", text: "FY 2024–25" }
          ],
          step: "PERIOD_SELECT"
        };
      }

      case "REGISTRATION": {
        if (cleanAction === "btn_cancel_reg") {
          return this.getInitialMessage();
        }
        // Simulated registration
        const newInst = {
          id: "inst_ahmedabad_03",
          company_name: "Apex Green Metals Pvt Ltd",
          installation_name: "Plant 2 (Ahmedabad)",
          location: "Plot 10, Sanand GIDC, Ahmedabad, Gujarat",
          country: "India",
          address: "Plot 10, Sanand GIDC",
          industry: "Textiles",
        };
        s.active_installation = newInst;
        s.facility_name = newInst.installation_name;
        s.location = newInst.location;
        s.step = "PERIOD_SELECT";

        return {
          sender: "purechain",
          text: `✅ Facility Registered Successfully!\n\n🏢 ${newInst.company_name}\n🏭 ${newInst.installation_name}\n📍 ${newInst.location}\n\n🌿 HARIYALI – Carbon Footprint\n\nYour facility has been registered successfully.\n\n📅 Please select your reporting financial year.`,
          buttons: [
            { id: "btn_reporting_period:FY 2025–26", text: "FY 2025–26" },
            { id: "btn_reporting_period:FY 2024–25", text: "FY 2024–25" }
          ],
          step: "PERIOD_SELECT"
        };
      }

      case "PERIOD_SELECT": {
        if (cleanAction.includes("2024-25") || cleanAction.includes("2024–25")) {
          s.reporting_period = "FY 2024–25";
          s.step = "COLLECTING";
          // Case B: No data for FY 24-25
          return {
            sender: "purechain",
            text: `📊 No previous monthly activity data was found for this facility for ${s.reporting_period}.\n\nYou can start entering your monthly activity data now.\n\nYou can type your information or upload your business records.`,
            buttons: [
              { id: "btn_continue_assessment", text: "Start Data Entry" },
              { id: "btn_switch_facility", text: "🏢 Switch Facility" }
            ],
            step: "PERIOD_SELECT"
          };
        } else {
          s.reporting_period = "FY 2025–26";
          s.step = "MONTHLY_OVERVIEW";
          return this.renderMonthlyOverview();
        }
      }

      case "MONTHLY_OVERVIEW": {
        if (cleanAction === "btn_continue_assessment" || cleanAction === "btn_add_month") {
          s.step = "COLLECTING";
          return this.renderPersonalizedCollectionPrompt();
        }
        break;
      }

      case "RECORD_VIEW": {
        if (cleanAction === "btn_update_month") {
          s.step = "FUEL_INPUT";
          return {
            sender: "purechain",
            text: `✏️ *Updating October 2025 Activity Data*\n\nPlease enter updated Scope 1 fuel consumption for *October 2025*:`,
            buttons: [
              { id: "btn_fuel_2600", text: "Use 2,600 L Diesel" },
              { id: "btn_fuel_3200", text: "Use 3,200 L Diesel" }
            ],
            step: "FUEL_INPUT"
          };
        }
        break;
      }

      case "YTD_VIEW": {
        if (cleanAction === "btn_add_month") {
          s.step = "COLLECTING";
          return this.renderPersonalizedCollectionPrompt();
        }
        break;
      }

      case "COLLECTING": {
        s.step = "FUEL_INPUT";
        return {
          sender: "purechain",
          text: `⛽ *Scope 1 — Direct Fuel Combustion*\n\nPlease enter your fuel consumption for *${s.month}* (e.g. diesel used for backup generators, boilers, or industrial furnaces).\n\n_Default recorded receipt:_ \`2,600 Litres of High Speed Diesel (HSD)\``,
          buttons: [
            { id: "btn_fuel_2600", text: "Use 2,600 L Diesel" },
            { id: "btn_fuel_3200", text: "Use 3,200 L Diesel" },
            { id: "btn_fuel_upload", text: "📎 Upload Fuel Invoice" }
          ],
          step: "FUEL_INPUT"
        };
      }

      case "FUEL_INPUT": {
        if (cleanAction === "btn_fuel_3200") s.diesel_litres = 3200.0;
        else if (cleanAction === "btn_fuel_upload") {
          return this.triggerDocumentDemonstration("doc_fuel_invoice_4921", "ELECTRICITY_INPUT");
        } else {
          s.diesel_litres = 2600.0;
        }

        s.step = "ELECTRICITY_INPUT";
        return {
          sender: "purechain",
          text: `⚡ *Scope 2 — Purchased Grid Electricity*\n\nPlease enter your electricity consumption from the utility grid for *${s.month}* (in kWh or MWh).\n\n_Default meter entry:_ \`14,500 kWh\``,
          buttons: [
            { id: "btn_elec_14500", text: "Use 14,500 kWh" },
            { id: "btn_elec_upload", text: "📎 Upload Electric Bill" },
            { id: "btn_elec_18000", text: "Use 18,000 kWh" }
          ],
          step: "ELECTRICITY_INPUT"
        };
      }

      case "ELECTRICITY_INPUT": {
        if (cleanAction === "btn_elec_upload") {
          // Trigger document simulation with OCR conflict demonstration
          return this.triggerDocumentDemonstration("doc_elec_mar2026", "CONFLICT");
        } else if (cleanAction === "btn_elec_18000") {
          s.electricity_kwh = 18000.0;
        } else {
          s.electricity_kwh = 14500.0;
        }

        s.step = "PRODUCTION_INPUT";
        return {
          sender: "purechain",
          text: `📦 *Production Output (Optional)*\n\nTo calculate your facility's product carbon intensity (tCO₂e per tonne of output), enter your finished production quantity for ${s.month}.\n\n_Default recorded production:_ \`150.0 tonnes of ${s.product_name}\``,
          buttons: [
            { id: "btn_prod_150", text: "150.0 t Billets" },
            { id: "btn_prod_skip", text: "Continue No Prod" }
          ],
          step: "PRODUCTION_INPUT"
        };
      }

      case "CONFLICT": {
        if (cleanAction === "btn_conflict_ocr") {
          s.electricity_kwh = 15200.0; // Document value
          s.conflict_resolved = true;
        } else {
          s.electricity_kwh = 14500.0; // User entry
          s.conflict_resolved = true;
        }

        s.step = "PRODUCTION_INPUT";
        return {
          sender: "purechain",
          text: `✅ *Value Updated*: Using electricity consumption of *${s.electricity_kwh.toLocaleString()} kWh* for ${s.month}.\n\n📦 *Production Output (Optional)*\n\nEnter finished production quantity for ${s.month} to compute specific intensity:\n• Product: *${s.product_name}*\n• Default: *${s.production_tonnes} tonnes*`,
          buttons: [
            { id: "btn_prod_150", text: "150.0 t Billets" },
            { id: "btn_prod_skip", text: "Continue No Prod" }
          ],
          step: "PRODUCTION_INPUT"
        };
      }

      case "PRODUCTION_INPUT": {
        if (cleanAction === "btn_prod_skip") s.production_tonnes = 0.0;
        else s.production_tonnes = 150.0;

        s.step = "SCOPE3_OFFER";
        return {
          sender: "purechain",
          text: `✅ I have enough information for your basic carbon footprint.\n\n🚚 Would you like to include supply chain (Scope 3) emissions?\n\nThis includes logistics, waste, purchased goods, and business travel.`,
          buttons: [
            { id: "btn_include_supply_chain", text: "Yes, Include Supply" },
            { id: "btn_calculate_now", text: "No, Calculate Now" }
          ],
          step: "SCOPE3_OFFER"
        };
      }

      case "SCOPE3_OFFER": {
        s.include_scope3 = (cleanAction === "btn_include_supply_chain");
        if (!s.include_scope3) s.scope3_transport_spend = 0.0;
        else s.scope3_transport_spend = 34500.0;

        s.step = "CONFIRMATION";
        return this.renderConfirmationSummary();
      }

      case "CONFIRMATION": {
        if (cleanAction === "btn_change_something") {
          s.step = "FUEL_INPUT";
          return {
            sender: "purechain",
            text: `✏️ *What would you like to update?*\n\nLet's re-verify your Fuel activity data:`,
            buttons: [
              { id: "btn_fuel_2600", text: "Use 2,600 L Diesel" },
              { id: "btn_fuel_3200", text: "Use 3,200 L Diesel" }
            ],
            step: "FUEL_INPUT"
          };
        }

        // Final Confirm & Calculate
        s.calculation_result = HARIYALI_DATA.calculate(s);
        s.step = "RESULT";
        return this.renderResultScreen();
      }

      case "RESULT": {
        if (cleanAction === "btn_report_all_available") {
          s.report_mode = "ALL_AVAILABLE";
          s.step = "REPORT_DELIVERY";
          return this.deliverReportMessage("ALL_AVAILABLE");
        }
        if (cleanAction === "btn_report_current_calc") {
          s.report_mode = "CURRENT_CALCULATION";
          s.step = "REPORT_DELIVERY";
          return this.deliverReportMessage("CURRENT_CALCULATION");
        }
        if (cleanAction === "btn_add_month") {
          s.step = "COLLECTING";
          s.month = "December 2025";
          return this.renderPersonalizedCollectionPrompt();
        }
        break;
      }

      case "REPORT_DELIVERY": {
        if (cleanAction === "btn_report_all_available") {
          s.report_mode = "ALL_AVAILABLE";
          return this.deliverReportMessage("ALL_AVAILABLE");
        }
        if (cleanAction === "btn_report_current_calc") {
          s.report_mode = "CURRENT_CALCULATION";
          return this.deliverReportMessage("CURRENT_CALCULATION");
        }
        if (cleanAction === "btn_add_month") {
          s.step = "COLLECTING";
          s.month = "December 2025";
          return this.renderPersonalizedCollectionPrompt();
        }
        break;
      }

      default:
        this.reset();
        return this.getInitialMessage();
    }
  }

  renderMonthlyOverview() {
    const s = this.state;
    const months = HARIYALI_DATA.confirmed_months;
    const lines = [
      "📊 Previous monthly activity data is available for this facility.\n",
      `Reporting Period: ${s.reporting_period}\n`,
      "Here is your monthly activity overview.\n",
      "🌱 *Carbon Footprint Assessment*\n",
      `Company: ${s.company_name}`,
      `Facility: ${s.facility_name}`,
      `Location: ${s.location}`,
      `Reporting Period: ${s.reporting_period}\n`,
      "📅 *Your Existing Monthly Activity Data*\n",
    ];

    months.forEach(m => {
      lines.push(`✅ ${m.display} — Data available`);
    });

    lines.push(`\n*You already have activity data for ${months.length} months.*\n`);
    lines.push("💡 _Available actions: View Monthly Data, Update Existing Month, Add Next Month, Switch Facility, or Add New Facility._\n");
    lines.push(`Which month would you like to enter next?`);

    return {
      sender: "purechain",
      text: lines.join("\n").trim(),
      buttons: [
        { id: "btn_add_month", text: "➕ Add Next Month" },
        { id: "btn_view_record", text: "View Monthly Data" },
        { id: "btn_view_ytd", text: "📊 View Cumulative/YTD" },
        { id: "btn_switch_facility", text: "🏢 Switch Facility" }
      ],
      step: "MONTHLY_OVERVIEW"
    };
  }

  renderExistingMonthRecord() {
    const last = HARIYALI_DATA.confirmed_months[HARIYALI_DATA.confirmed_months.length - 1];
    const text = `📅 ${last.display} is already recorded.\n\n⚡ Electricity: ${last.electricity_kwh.toLocaleString()} kWh\n⛽ Diesel: ${last.diesel_litres.toLocaleString()} litres\n🏭 Production: ${last.production_tonnes} tonnes\n\n🌱 Carbon Footprint: ${last.footprint_tco2e.toFixed(2)} tCO₂e`;

    return {
      sender: "purechain",
      text: text,
      buttons: [
        { id: "btn_update_month", text: "✏️ Update Month" },
        { id: "btn_add_month", text: "➕ Add Next Month" },
        { id: "btn_view_ytd", text: "📊 View Cumulative/YTD" }
      ],
      step: "RECORD_VIEW"
    };
  }

  renderYtdView() {
    const s = this.state;
    const months = HARIYALI_DATA.confirmed_months;
    const lines = ["📊 2025-26 Year-to-Date Carbon Footprint\n"];

    let total = 0;
    months.forEach(m => {
      lines.push(`${m.display}: ${m.footprint_tco2e.toFixed(2)} tCO₂e`);
      total += m.footprint_tco2e;
    });

    lines.push(`\nTotal: ${total.toFixed(2)} tCO₂e`);

    return {
      sender: "purechain",
      text: lines.join("\n"),
      buttons: [
        { id: "btn_add_month", text: "➕ Add Next Month" },
        { id: "btn_view_record", text: "View Monthly Data" }
      ],
      step: "YTD_VIEW"
    };
  }

  renderPersonalizedCollectionPrompt() {
    const s = this.state;
    const text = `🌿 *Carbon Footprint (Purechain)*\n\n🏢 *Company:* ${s.company_name}\n\n🏭 *Installation:* ${s.facility_name}\n\n📍 *Location:* ${s.location}\n\n📅 *Reporting Period:* ${s.reporting_period}\n\nYou can now enter your monthly activity data or upload your business records.\n\n*You can upload:*\n\n⚡ Electricity bills\n⛽ Fuel records/invoices\n📦 Production reports\n🚚 Purchase/logistics records\n\nYou can also combine typed information with uploaded documents.\n\n*Example:*\n\n'${s.month}, Diesel 2600 litres, Electricity 14500 kWh, Production 150 tonnes'\n\nYou can start by sharing whatever monthly information you have.`;

    return {
      sender: "purechain",
      text: text,
      buttons: [
        { id: "btn_enter_data", text: `Provide ${s.month} Data` },
        { id: "btn_upload_bill", text: "📎 Upload Documents" },
        { id: "btn_h_fast_track", text: "⚡ Fast-Track Demo Run" }
      ],
      step: "COLLECTING"
    };
  }

  triggerDocumentDemonstration(docId, nextStep) {
    const doc = window.SAMPLE_DOCS.find(d => d.id === docId);
    const s = this.state;
    s.step = nextStep;

    const ocrCardHtml = window.ocrEngine.renderExtractionCard(doc);

    if (doc.extracted_data.has_conflict) {
      s.has_conflict = true;
      const c = doc.extracted_data;
      const conflictMsg = `I found a difference in your Electricity Quantity values for ${s.month}:\n\n📄 Document: ${c.extracted_value.toLocaleString()} kWh\n✍️ Your entry: ${s.electricity_kwh.toLocaleString()} kWh\n\nWhich value should I use?`;

      return {
        sender: "purechain",
        text: `📄 *Document Ingested & Analyzed*: \`${doc.name}\`\n\n${ocrCardHtml}\n${conflictMsg}`,
        buttons: [
          { id: "btn_conflict_typed", text: `Use ${s.electricity_kwh.toLocaleString()} kWh` },
          { id: "btn_conflict_ocr", text: `Use ${c.extracted_value.toLocaleString()} kWh` }
        ],
        step: "CONFLICT"
      };
    } else {
      return {
        sender: "purechain",
        text: `📄 *Document Ingested & Analyzed*: \`${doc.name}\`\n\n${ocrCardHtml}\nI found:\n📅 ${s.month}\n⛽ High Speed Diesel: *${doc.extracted_data.extracted_value.toLocaleString()} Litres*\n\nData has been verified with 98.9% OCR confidence.`,
        buttons: [
          { id: "btn_doc_confirm", text: "✅ Confirm & Proceed" }
        ],
        step: nextStep
      };
    }
  }

  renderConfirmationSummary() {
    const s = this.state;
    const lines = [
      "Got it. I found:\n",
      `🏭 Business: ${s.company_name}`,
      `📍 Location: ${s.location}`,
      `📅 Activity Month: ${s.month}`,
    ];

    if (s.production_tonnes > 0) {
      lines.push(`🧵 Product: ${s.product_name}`);
      lines.push(`📦 Production: ${s.production_tonnes.toFixed(2)} tonnes`);
    }

    lines.push(`⛽ Diesel: ${s.diesel_litres.toLocaleString()} litres`);
    lines.push(`⚡ Electricity: ${s.electricity_kwh.toLocaleString()} kWh`);

    if (s.include_scope3 && s.scope3_transport_spend > 0) {
      lines.push(`\n🚚 Supply Chain`);
      lines.push(`• Upstream Freight: ₹${s.scope3_transport_spend.toLocaleString()}`);
    }

    lines.push("\nPlease confirm your details and monthly activity data.");

    return {
      sender: "purechain",
      text: lines.join("\n"),
      buttons: [
        { id: "btn_confirm_calc", text: "✅ Calculate" },
        { id: "btn_change_something", text: "✏️ Change Something" }
      ],
      step: "CONFIRMATION"
    };
  }

  renderResultScreen() {
    const s = this.state;
    const res = s.calculation_result || HARIYALI_DATA.calculate(s);
    s.calculation_result = res;

    const s1_kg = res.scope1.emissions_kg;
    const s2_kg = res.scope2.emissions_kg;
    const s3_kg = res.scope3 ? res.scope3.emissions_kg : 0;
    const total_kg = res.total_emissions_kg;
    const total_tonnes = res.total_emissions_tco2e;

    const text = `🌱 Your Carbon Footprint Assessment is Complete!

🏢 Company: ${s.company_name}
📍 Location: ${s.location}
📅 Reporting Period: ${s.reporting_period}

━━━━━━━━━━━━━━━━━━
📊 INPUT DATA
━━━━━━━━━━━━━━━━━━

⛽ Scope 1 — Direct Fuel
• Diesel: ${res.scope1.quantity.toLocaleString()} litres

⚡ Scope 2 — Electricity
• Electricity: ${res.scope2.quantity.toLocaleString()} kWh

${res.production_tonnes > 0 ? `🏭 Production\n• Production: ${res.production_tonnes} tonnes\n` : ''}
${res.scope3 ? `🚚 Scope 3 — Supply Chain\n• Upstream Freight: ₹${res.scope3.spend_inr.toLocaleString()}\n` : ''}
━━━━━━━━━━━━━━━━━━
🌍 EMISSIONS BREAKDOWN
━━━━━━━━━━━━━━━━━━

🔴 Scope 1 — Direct Emissions
${s1_kg.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} kg CO₂e

🟡 Scope 2 — Electricity
${s2_kg.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} kg CO₂e
${res.scope3 ? `\n🔵 Scope 3 — Supply Chain\n${s3_kg.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} kg CO₂e` : `\n🔵 Scope 3\nNot included in this assessment.`}

━━━━━━━━━━━━━━━━━━
🌎 TOTAL CARBON FOOTPRINT
━━━━━━━━━━━━━━━━━━

${total_kg.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} kg CO₂e
≈ ${total_tonnes.toFixed(2)} tonnes CO₂e

━━━━━━━━━━━━━━━━━━
📈 SUMMARY
━━━━━━━━━━━━━━━━━━

• Scope 1: ${(s1_kg / 1000).toFixed(2)} tCO₂e
• Scope 2: ${(s2_kg / 1000).toFixed(2)} tCO₂e
${res.scope3 ? `• Scope 3: ${(s3_kg / 1000).toFixed(2)} tCO₂e\n` : ''}• Total: ${total_tonnes.toFixed(2)} tCO₂e
${res.production_tonnes > 0 ? `\n📊 Carbon Intensity:\n${res.carbon_intensity_tco2e_per_tonne.toFixed(4)} tCO₂e per tonne\n` : ''}
Thank you for completing your Carbon Footprint Assessment with Purechain. 🌱

📄 *Choose a GHG Emissions Report Option (PDF):*
• *📊 All Available Data*: Consolidated report covering all available months in this reporting period.
• *📄 Current Month Only*: Detailed statement of this calculation execution only.`;

    return {
      sender: "purechain",
      text: text,
      buttons: [
        { id: "btn_report_all_available", text: "📊 All Available Data" },
        { id: "btn_report_current_calc", text: "📄 Current Month Only" },
        { id: "btn_add_month", text: "➕ Add Next Month" }
      ],
      step: "RESULT"
    };
  }

  deliverReportMessage(mode) {
    const s = this.state;
    const isAll = (mode === "ALL_AVAILABLE");
    const periodStr = s.reporting_period.replace(/\s+/g, "_");
    const monthStr = s.month.replace(/\s+/g, "_");

    const filename = isAll
      ? `Purechain_HARIYALI_GHG_Report_All_Available_${periodStr}.pdf`
      : `Purechain_HARIYALI_GHG_Report_Current_${monthStr}.pdf`;

    const docMsg = {
      sender: "purechain",
      document: {
        filename: filename,
        size: isAll ? "382 KB" : "248 KB",
        type: "HARIYALI",
        mode: mode,
      },
      text: "",
      step: "REPORT_DELIVERY"
    };

    const ackText = isAll
      ? `📄 *Your Consolidated HARIYALI GHG Emissions Report has been generated and delivered above.*\n\n📅 *Reporting Period:* ${s.reporting_period}\n📊 *Coverage:* All Available Monthly Data (Canonical HARIYALI factors)\n\nIndividual monthly Scope 1, 2, and 3 disclosures and consolidated totals are presented in Section 6 and Section 7.`
      : `📄 *Your HARIYALI GHG Emissions Report (Current Calculation Only) has been generated and delivered above.*\n\n📅 *Activity Month:* ${s.month}\n📊 *Coverage:* Current Calculation Execution Only (Historical months excluded)\n\nQuantities, emission factors, formulas, emissions, and evidence references for this execution are presented in Section 6.`;

    const ackMsg = {
      sender: "purechain",
      text: ackText,
      buttons: [
        { id: isAll ? "btn_report_current_calc" : "btn_report_all_available", text: isAll ? "📄 Current Month Only" : "📊 All Available Data" },
        { id: "btn_add_month", text: "➕ Add Next Month" },
        { id: "btn_view_ytd", text: "📊 View Cumulative/YTD" }
      ],
      step: "REPORT_DELIVERY"
    };

    return [docMsg, ackMsg];
  }
}

window.HariyaliEngine = HariyaliEngine;

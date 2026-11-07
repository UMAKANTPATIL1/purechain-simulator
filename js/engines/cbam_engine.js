/**
 * Purechain AI — CBAM State Machine Engine
 * Strictly follows Purechain cbam_flow_service.py messages, buttons, and statutory rules.
 */

class CBAMEngine {
  constructor(app) {
    this.app = app;
    this.reset();
  }

  reset() {
    this.state = {
      step: "ENTRY",
      role: "producer",
      company_name: CBAM_DATA.producer.company_name,
      installation_name: CBAM_DATA.producer.installation_name,
      installation_country: CBAM_DATA.producer.installation_country,
      period: CBAM_DATA.producer.reporting_period_display,
      product_name: CBAM_DATA.product.product_name,
      cn_code: CBAM_DATA.product.cn_code,
      sector: CBAM_DATA.product.sector,
      production_route: CBAM_DATA.product.production_route,
      production_quantity: CBAM_DATA.default_inputs.production_quantity_tonnes,
      eu_export_quantity: CBAM_DATA.default_inputs.eu_export_quantity_tonnes,
      eu_destination_country: CBAM_DATA.default_inputs.eu_destination_country,
      direct_emissions: CBAM_DATA.default_inputs.direct_emissions_tco2e,
      indirect_emissions: CBAM_DATA.default_inputs.indirect_emissions_tco2e,
      electricity_mwh: CBAM_DATA.default_inputs.electricity_mwh,
      pfc_status: "NOT_APPLICABLE",
      energy_transfers: {
        heat_imported: 120.0,
        heat_exported_status: "NOT_REPORTED",
        waste_gas_imported_status: "NOT_APPLICABLE",
        waste_gas_exported_status: "NOT_APPLICABLE",
        captive_electricity: 85.0,
        captive_status: "PENDING_VERIFICATION",
      },
      biomass_fraction: 0.12,
      biomass_cert_id: "RED-EU-2026-8812-IN",
      biomass_status: "PENDING_VERIFICATION", // 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED'
      precursors: [...CBAM_DATA.default_inputs.precursors],
      carbon_price_eur: 0.0,
      calculation_result: null,
      history: [],
    };
  }

  getInitialMessage() {
    return {
      sender: "purechain",
      text: `⚖️ *Purechain CBAM Compliance & Assessment Service*\n\nWelcome to the automated EU CBAM accounting & reporting assistant (Regulation EU 2023/956 & Annex III).\n\nLet's get started with your transaction role:`,
      buttons: [
        { id: "btn_cbam_role_producer", text: "Non-EU Producer" },
        { id: "btn_cbam_role_importer", text: "EU Importer" },
        { id: "btn_cbam_fast_track", text: "⚡ Fast-Track Demo Run" }
      ],
      step: "ENTRY"
    };
  }

  handleUserAction(actionId, textInput) {
    const s = this.state;

    // Fast track demo
    if (actionId === "btn_cbam_fast_track") {
      s.calculation_result = CBAM_DATA.calculate({
        ...s,
        biomass_verifier_status: s.biomass_status,
      });
      s.step = "RESULT";
      return this.renderResultScreen();
    }

    switch (s.step) {
      case "ENTRY":
        s.role = (actionId === "btn_cbam_role_importer") ? "importer" : "producer";
        s.step = "INSTALLATION";
        return {
          sender: "purechain",
          text: `🏭 *Company & Installation Selection*\n\nFound registered manufacturing installation:\n• Company: *${s.company_name}*\n• Installation: *${s.installation_name}*\n• Country: *${s.installation_country}*\n\nWould you like to conduct the assessment for this facility?`,
          buttons: [
            { id: "btn_cbam_confirm_inst", text: "Confirm Installation" },
            { id: "btn_cbam_change_inst", text: "✏️ Change Facility" }
          ],
          step: "INSTALLATION"
        };

      case "INSTALLATION":
        s.step = "PERIOD";
        return {
          sender: "purechain",
          text: `📅 *CBAM Reporting Period*\n\nPlease select the applicable reporting period (pursuant to Commission Implementing Regulation (EU) 2023/1773):\n\n• Default: *${s.period}*`,
          buttons: [
            { id: "btn_cbam_period_cy2026", text: "CY 2026 (Jan–Dec)" },
            { id: "btn_cbam_period_q1", text: "2026 Q1 (Jan–Mar)" },
            { id: "btn_cbam_period_custom", text: "Custom Period" }
          ],
          step: "PERIOD"
        };

      case "PERIOD":
        if (actionId === "btn_cbam_period_q1") s.period = "1 Jan 2026 to 31 Mar 2026 (2026 Q1)";
        s.step = "PRODUCT_CN";
        return {
          sender: "purechain",
          text: `📦 *Product Identification & CN Code*\n\nEnter the product name and 8-digit EU Combined Nomenclature (CN) code:\n\n• Product: *${s.product_name}*\n• CN Code: *${s.cn_code}*\n• Sector: *${s.sector}* (Annex I)\n• Aggregated Category: *Iron or steel products*\n\n_Indirect Emissions Treatment:_ \`INCLUDED\` (Regulation EU 2023/956 Annex I)`,
          buttons: [
            { id: "btn_cbam_confirm_cn", text: "Confirm CN 7213 91 10" },
            { id: "btn_cbam_upload_spec", text: "📄 Upload Product Sheet" },
            { id: "btn_cbam_find_cn", text: "Find My CN Code" }
          ],
          step: "PRODUCT_CN"
        };

      case "PRODUCT_CN":
        s.step = "ROUTE_QUANTITY";
        return {
          sender: "purechain",
          text: `⚙️ *Production Route & Quantity*\n\n• Route: *${s.production_route}*\n• Applicable Annex: *Annex III Section 3 (Steel)*\n\nPlease specify total production quantity for ${s.period}:\n\n_Default recorded production:_ \`5,000.0 tonnes\``,
          buttons: [
            { id: "btn_cbam_qty_5000", text: "5,000 Tonnes" },
            { id: "btn_cbam_qty_7500", text: "7,500 Tonnes" },
            { id: "btn_cbam_qty_custom", text: "Enter Other Qty" }
          ],
          step: "ROUTE_QUANTITY"
        };

      case "ROUTE_QUANTITY":
        if (actionId === "btn_cbam_qty_7500") s.production_quantity = 7500.0;
        else if (textInput && !isNaN(parseFloat(textInput))) s.production_quantity = parseFloat(textInput);
        else s.production_quantity = 5000.0;

        s.step = "EXPORT_DEST";
        return {
          sender: "purechain",
          text: `🇪🇺 *EU Export Consignment & Destination*\n\nPlease specify the quantity exported or destined for the European Union and the destination member state:\n\n_Default recorded export:_ \`1,200.0 tonnes destined for Germany\``,
          buttons: [
            { id: "btn_cbam_export_1200", text: "1,200 Tonnes (Germany)" },
            { id: "btn_cbam_export_2000", text: "2,000 Tonnes (Italy)" },
            { id: "btn_cbam_export_custom", text: "Custom Export" }
          ],
          step: "EXPORT_DEST"
        };

      case "EXPORT_DEST":
        if (actionId === "btn_cbam_export_2000") {
          s.eu_export_quantity = 2000.0;
          s.eu_destination_country = "Italy";
        } else if (textInput && !isNaN(parseFloat(textInput))) {
          s.eu_export_quantity = parseFloat(textInput);
        } else {
          s.eu_export_quantity = 1200.0;
          s.eu_destination_country = "Germany";
        }

        s.step = "DIRECT_EMISSIONS";
        return {
          sender: "purechain",
          text: `🔥 *Direct Emissions ($DirEm$)*\n\nPlease enter the total direct emissions from fuel combustion and process reactions (excluding biomass deduction and energy transfers):\n\n_Default recorded emissions:_ \`2,150.0 tCO₂e\``,
          buttons: [
            { id: "btn_cbam_direct_2150", text: "2,150.0 tCO₂e" },
            { id: "btn_cbam_direct_2800", text: "2,800.0 tCO₂e" },
            { id: "btn_cbam_direct_upload", text: "Upload Fuel Log" }
          ],
          step: "DIRECT_EMISSIONS"
        };

      case "DIRECT_EMISSIONS":
        if (actionId === "btn_cbam_direct_2800") s.direct_emissions = 2800.0;
        else if (textInput && !isNaN(parseFloat(textInput))) s.direct_emissions = parseFloat(textInput);
        else s.direct_emissions = 2150.0;

        s.step = "PFC_EVALUATION";
        return {
          sender: "purechain",
          text: `ℹ️ *Perfluorocarbons (PFC) Emissions Verification*\n\nEvaluated Production Route: *Electric Arc Furnace (EAF)* under CN \`${s.cn_code}\` (Iron & Steel).\n\nUnder Commission Implementing Regulation (EU) 2023/1773, PFC emissions apply strictly to primary aluminium electrolysis smelters. For non-alloy steel wire rod, PFC emissions are verified **NOT_APPLICABLE** (0.0 tCO₂e).`,
          buttons: [
            { id: "btn_cbam_pfc_confirm", text: "✅ Confirm & Proceed" }
          ],
          step: "PFC_EVALUATION"
        };

      case "PFC_EVALUATION":
        s.step = "ELECTRICITY";
        return {
          sender: "purechain",
          text: `⚡ *Electricity & Indirect Emissions ($IndirEm$)*\n\nUnder Regulation (EU) 2023/956 Annex I, indirect emissions are **INCLUDED** for the Iron and Steel sector.\n\n• Measured Electricity Consumption: *${s.electricity_mwh.toLocaleString()} MWh*\n• Calculated Indirect Emissions: *${s.indirect_emissions.toLocaleString()} tCO₂e*\n\n_Source:_ \`Eligible HARIYALI activity records retrieved (read-only)\``,
          buttons: [
            { id: "btn_cbam_elec_confirm", text: "Confirm 1,850.0 tCO₂e" },
            { id: "btn_cbam_elec_edit", text: "✏️ Change Electricity" }
          ],
          step: "ELECTRICITY"
        };

      case "ELECTRICITY":
        s.step = "ENERGY_TRANSFERS";
        return {
          sender: "purechain",
          text: `⚡ *Energy Transfers & Captive Power (Commission Guidance 3 Eq 55)*\n\nPlease declare measurable heat transfers, waste gases, and on-site captive electricity generation:\n\n• Heat Imported: *120.0 tCO₂e* (REPORTED)\n• Heat Exported: *NOT_REPORTED*\n• Waste Gas Imported: *NOT_APPLICABLE*\n• Waste Gas Exported: *NOT_APPLICABLE*\n• On-site Captive Electricity: *85.0 tCO₂e* (PENDING_VERIFICATION)\n\n_Statutory rule: Omitted values are preserved as NOT_REPORTED; zero values are never fabricated._`,
          buttons: [
            { id: "btn_cbam_energy_confirm", text: "Confirm Energy Transfers" },
            { id: "btn_cbam_energy_none", text: "None / Not Applicable" },
            { id: "btn_cbam_energy_edit", text: "✏️ Edit Transfers" }
          ],
          step: "ENERGY_TRANSFERS"
        };

      case "ENERGY_TRANSFERS":
        if (actionId === "btn_cbam_energy_none") {
          s.energy_transfers.heat_imported = 0.0;
          s.energy_transfers.captive_electricity = 0.0;
        }
        s.step = "BIOMASS";
        return {
          sender: "purechain",
          text: `🌱 *Biomass Fuel Fraction & Sustainability*\n\nDid your installation consume biomass fuels during this reporting period?\n\n• Biomass Fuel Fraction: *12.0%*\n• Sustainability Standard: *Directive (EU) 2018/2001 (RED II) Articles 29–31*\n• Declared Certificate: \`RED-EU-2026-8812-IN\`\n\nChoose verification scenario to demonstrate regulatory calculation treatment:`,
          buttons: [
            { id: "btn_cbam_bio_pending", text: "1️⃣ Pending Verification (0% Zero-Rating)" },
            { id: "btn_cbam_bio_verified", text: "2️⃣ Accredited Verifier Approved (Zero-Rated)" },
            { id: "btn_cbam_bio_rejected", text: "3️⃣ Rejected / Uncertified (0% Zero-Rating)" }
          ],
          step: "BIOMASS"
        };

      case "BIOMASS":
        if (actionId === "btn_cbam_bio_verified") {
          s.biomass_status = "VERIFIED";
        } else if (actionId === "btn_cbam_bio_rejected") {
          s.biomass_status = "REJECTED";
        } else {
          s.biomass_status = "PENDING_VERIFICATION";
        }

        s.step = "PRECURSORS";
        return {
          sender: "purechain",
          text: `🔩 *Upstream Relevant Precursors Attribution*\n\nUnder Annex III Section 3, steel wire rod requires embedding emissions of relevant complex precursors:\n\n• Precursor: *Direct Reduced Iron (DRI / Sponge Iron)* (CN \`7203 10 00\`)\n• Consumed Quantity: *4,200.0 tonnes*\n• Specific Embedded Emissions: *1.820000 tCO₂e/tonne*\n• Provenance: *Supplier Verified (Annex IV Schedule)*\n• Total Precursor Emissions: *7,644.0 tCO₂e*\n\nWould you like to verify this precursor?`,
          buttons: [
            { id: "btn_cbam_prec_confirm", text: "Confirm Precursor (4,200 t)" },
            { id: "btn_cbam_prec_doc", text: "📄 Upload Precursor Cert" },
            { id: "btn_cbam_prec_skip", text: "No Precursors" }
          ],
          step: "PRECURSORS"
        };

      case "PRECURSORS":
        if (actionId === "btn_cbam_prec_doc") {
          // Document upload demonstration
          return this.triggerDocumentDemonstration("doc_cbam_precursor_dri", "CARBON_PRICE");
        }
        s.step = "CARBON_PRICE";
        return {
          sender: "purechain",
          text: `💶 *Carbon Price Paid in Country of Origin*\n\nHas an effective carbon price been paid for the embedded emissions in India (e.g., Clean Energy Cess or carbon credits under the Carbon Credit Trading Scheme)?\n\n_Declared Credit:_ \`€0.00\``,
          buttons: [
            { id: "btn_cbam_cprice_zero", text: "Confirm €0.00 Credit" },
            { id: "btn_cbam_cprice_claim", text: "Claim €12,500 Credit" }
          ],
          step: "CARBON_PRICE"
        };

      case "CARBON_PRICE":
        if (actionId === "btn_cbam_cprice_claim") {
          s.carbon_price_eur = 12500.0;
        } else {
          s.carbon_price_eur = 0.0;
        }

        s.step = "REVIEW";
        return this.renderReviewSummary();

      case "REVIEW":
        if (actionId === "btn_cbam_edit_details") {
          s.step = "ROUTE_QUANTITY";
          return {
            sender: "purechain",
            text: `✏️ *Edit Assessment Details*\n\nLet's re-verify your Production Quantity:`,
            buttons: [
              { id: "btn_cbam_qty_5000", text: "5,000 Tonnes" },
              { id: "btn_cbam_qty_7500", text: "7,500 Tonnes" }
            ],
            step: "ROUTE_QUANTITY"
          };
        }

        // Final Confirm & Calculate
        s.calculation_result = CBAM_DATA.calculate({
          ...s,
          biomass_verifier_status: s.biomass_status,
          heat_imported_emissions: s.energy_transfers.heat_imported,
          captive_electricity_emissions: s.energy_transfers.captive_electricity,
          carbon_price_credit_eur: s.carbon_price_eur,
        });
        s.step = "RESULT";
        return this.renderResultScreen();

      case "RESULT":
        if (actionId === "btn_cbam_view_breakdown") {
          return this.renderBreakdownScreen();
        }
        if (actionId === "btn_cbam_view_analysis") {
          return this.renderAnalysisScreen();
        }
        if (actionId === "btn_cbam_download_report") {
          return {
            sender: "purechain",
            text: `📄 *EU CBAM Template T-5 Communication Document Ready*\n\nYour statutory CBAM declaration package for *${s.product_name}* (CN \`7213 91 10\`) has been compiled in official Template T-5 DOCX & PDF formats.\n\n[Click below to preview or download]`,
            buttons: [
              { id: "btn_cbam_open_pdf_modal", text: "👁️ Preview Template T-5 Report" },
              { id: "btn_cbam_view_breakdown", text: "📊 View Math Breakdown" },
              { id: "btn_cbam_view_analysis", text: "📈 View Exposure Analysis" }
            ],
            step: "REPORT_READY"
          };
        }
        break;

      case "REPORT_READY":
        if (actionId === "btn_cbam_view_breakdown") return this.renderBreakdownScreen();
        if (actionId === "btn_cbam_view_analysis") return this.renderAnalysisScreen();
        if (actionId === "btn_cbam_restart") {
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

    return {
      sender: "purechain",
      text: `📄 *Precursor Document Ingested & Verified*: \`${doc.name}\`\n\n${ocrCardHtml}\nPrecursor data verified with 99.5% confidence. 4,200.0 tonnes @ 1.82 tCO₂e/t attributed.`,
      buttons: [
        { id: "btn_cbam_doc_confirm", text: "✅ Confirm & Proceed" }
      ],
      step: nextStep
    };
  }

  renderReviewSummary() {
    const s = this.state;
    let bioStatusStr = "None (0%)";
    if (s.biomass_fraction > 0) {
      if (s.biomass_status === "VERIFIED") bioStatusStr = "12.0% (RED II Certified & Verified — Zero-Rated)";
      else if (s.biomass_status === "PENDING_VERIFICATION") bioStatusStr = "12.0% (Self-Declared RED II — Evidence Pending, 0% Zero-Rating)";
      else bioStatusStr = "12.0% (Uncertified / Rejected — 0% Zero-Rating)";
    }

    const lines = [
      "📋 *CBAM Assessment Review Summary*\n",
      `• Company: *${s.company_name}*`,
      `• Installation: *${s.installation_name} (${s.installation_country})*`,
      `• Reporting Period: *${s.period}*`,
      `• Product: *${s.product_name}*`,
      `• CN Code: *${s.cn_code}* (Sector: ${s.sector})`,
      `• Route: *${s.production_route}*`,
      `• Production Quantity: *${s.production_quantity.toLocaleString()} tonnes*`,
      `• Exported to EU: *${s.eu_export_quantity.toLocaleString()} tonnes (${s.eu_destination_country})*`,
      `• Direct Emissions: *${s.direct_emissions.toLocaleString()} tCO₂e*`,
      `• PFC Emissions: *Not applicable (Steel EAF route)*`,
      `• Electricity: *${s.electricity_mwh.toLocaleString()} MWh* (*${s.indirect_emissions.toLocaleString()} tCO₂e*)`,
      `• Energy Transfers:`,
      `  - Heat Imported: *${s.energy_transfers.heat_imported} tCO₂e* (REPORTED)`,
      `  - Heat Exported: *Not Reported*`,
      `  - Captive Power: *${s.energy_transfers.captive_electricity} tCO₂e* (PENDING_VERIFICATION)`,
      `• Biomass: *${bioStatusStr}*`,
      `• Precursors: *DRI (4,200.0 tonnes @ 1.82 tCO₂e/t)*`,
      `• Carbon Price Credit: *€${s.carbon_price_eur.toFixed(2)}*`,
      "\nPlease review your parameters before final statutory calculation."
    ];

    return {
      sender: "purechain",
      text: lines.join("\n"),
      buttons: [
        { id: "btn_cbam_confirm_calculate", text: "✅ Confirm & Calculate" },
        { id: "btn_cbam_edit_details", text: "✏️ Change Something" }
      ],
      step: "REVIEW"
    };
  }

  renderResultScreen() {
    const s = this.state;
    const res = s.calculation_result || CBAM_DATA.calculate({ ...s, biomass_verifier_status: s.biomass_status });
    s.calculation_result = res;

    let bioSummaryLine = "• Biomass: *None (0%)*";
    if (res.biomass_fraction > 0) {
      if (res.biomass_status === "VERIFIED") {
        bioSummaryLine = `• Biomass: *12.0% (Verified RED II: -${res.biomass_credit_tco2e.toFixed(1)} tCO₂e zero-rated)*`;
      } else {
        bioSummaryLine = `• Biomass: *12.0% (Unverified: 0% zero-rating per RED II Art. 29)*`;
      }
    }

    const text = `⚖️ *CBAM Assessment Result*

Product: *${res.product_name}*
Quantity Produced: *${res.production_quantity_tonnes.toLocaleString()} tonnes*
Exported to EU: *${res.eu_export_quantity_tonnes.toLocaleString()} tonnes (${res.eu_destination_country})*
(${res.eu_consignment_emissions_tco2e.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} tCO₂e consignment emissions)

📊 *Attributable Embedded Emissions:*
• Direct emissions: *${res.net_direct_emissions_tco2e.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})} tCO₂e*
• Indirect emissions: *${res.indirect_emissions_tco2e.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})} tCO₂e*
• Precursor emissions: *${res.precursor_emissions_tco2e.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})} tCO₂e*
• Total embedded emissions: *${res.total_embedded_emissions_tco2e.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})} tCO₂e*
• Specific embedded emissions: *${res.specific_embedded_emissions.toFixed(6)} tCO₂e/tonne*

⚡ *Energy Transfers & Biomass Calculation Summary:*
• Heat imported adjustment: *+${res.heat_imported_emissions.toFixed(1)} tCO₂e*
• On-site captive electricity: *${res.captive_electricity_emissions.toFixed(1)} tCO₂e* (PENDING_VERIFICATION)
${bioSummaryLine}
💶 Carbon price credit: *€${res.carbon_price_credit_eur.toFixed(2)}*

📋 CBAM-attributable embedded emissions: *${res.net_cbam_liability_tco2e.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} tCO₂e*
🎫 Indicative certificate quantity for the responsible EU declarant: *${res.certificate_quantity.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} certificates*

💶 Estimated Financial Exposure: *€${res.estimated_indicative_cost_eur.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}* (at €72.63 avg certificate price)

💡 _Demonstration Output strictly for client review. Does not constitute an officially filed CBAM declaration._`;

    return {
      sender: "purechain",
      text: text,
      buttons: [
        { id: "btn_cbam_view_breakdown", text: "📊 View Breakdown" },
        { id: "btn_cbam_view_analysis", text: "📈 View Analysis" },
        { id: "btn_cbam_download_report", text: "📄 Generate T-5 Report" }
      ],
      step: "RESULT"
    };
  }

  renderBreakdownScreen() {
    const s = this.state;
    const res = s.calculation_result || CBAM_DATA.calculate({ ...s, biomass_verifier_status: s.biomass_status });

    const text = `🔬 *Purechain CBAM — Calculation Math & Statutory Equation Trace*

1️⃣ *Direct Emissions Equation (Annex III Section 3 & Guidance 3 Eq 55):*
$$DirEm_{net} = DirEm_{gross} - BioCredit + (Heat_{imp} - Heat_{exp}) + (WG_{imp} - WG_{exp})$$
• $DirEm_{gross} = ${res.direct_emissions_tco2e.toLocaleString()}\\text{ tCO}_2\\text{e}$
• $BioCredit = ${res.biomass_credit_tco2e.toFixed(1)}\\text{ tCO}_2\\text{e}$ (Status: \`${res.biomass_status}\`)
• $Heat_{imp} = +${res.heat_imported_emissions.toFixed(1)}\\text{ tCO}_2\\text{e}$
• $\\mathbf{DirEm_{net} = ${res.net_direct_emissions_tco2e.toFixed(2)}\\text{ tCO}_2\\text{e}}$

2️⃣ *Indirect Emissions (Electricity):*
• Consumption: ${s.electricity_mwh.toLocaleString()} MWh
• Grid factor applied: 0.675000 tCO₂/MWh
• $\\mathbf{IndirEm = ${res.indirect_emissions_tco2e.toFixed(2)}\\text{ tCO}_2\\text{e}}$

3️⃣ *Precursors Embedded Emissions:*
• DRI Consumed: 4,200.0 tonnes @ 1.820000 tCO₂e/tonne
• $\\mathbf{PrecEm = 4,200.0 \\times 1.820000 = ${res.precursor_emissions_tco2e.toFixed(2)}\\text{ tCO}_2\\text{e}}$

4️⃣ *Specific Embedded Emissions ($SEE$):*
$$SEE = \\frac{TotalEmbeddedEmissions}{ProductionQuantity} = \\frac{${res.total_embedded_emissions_tco2e.toFixed(2)}}{${res.production_quantity_tonnes.toLocaleString()}} = \\mathbf{${res.specific_embedded_emissions.toFixed(6)}\\text{ tCO}_2\\text{e/tonne}}$$

5️⃣ *EU Export Consignment & Certificates:*
• Export: ${res.eu_export_quantity_tonnes.toLocaleString()} tonnes
• Attributable Consignment: ${res.eu_consignment_emissions_tco2e.toFixed(2)} tCO₂e
• EU ETS Certificates: $\\mathbf{${res.certificate_quantity.toFixed(2)}\\text{ certificates}}$`;

    return {
      sender: "purechain",
      text: text,
      buttons: [
        { id: "btn_cbam_view_analysis", text: "📈 View Exposure Analysis" },
        { id: "btn_cbam_download_report", text: "📄 Generate T-5 Report" }
      ],
      step: "RESULT"
    };
  }

  renderAnalysisScreen() {
    const s = this.state;
    const res = s.calculation_result || CBAM_DATA.calculate({ ...s, biomass_verifier_status: s.biomass_status });

    const text = `📈 *Purechain CBAM — Quarterly Financial Exposure & Scenario Analysis*

📅 *2026 Quarterly Certificate Price Projections:*
• *Q1 2026*: 300 t exposure @ €68.50/t = *€20,550.00*
• *Q2 2026*: 300 t exposure @ €71.20/t = *€21,360.00*
• *Q3 2026*: 300 t exposure @ €74.00/t = *€22,200.00*
• *Q4 2026*: 300 t exposure @ €76.80/t = *€23,040.00*
• *Full Year Total*: **€87,150.00** (Indicative)

💡 *Regulatory Sensitivity Insights:*
1. **Biomass Optimization**: Verifying RED II sustainability certification on 12% biomass saves approx. *${(res.direct_emissions_tco2e * 0.12 * 0.45 * 72.63).toLocaleString('en-US', {style: 'currency', currency: 'EUR'})}* in certificate costs.
2. **Precursor Sourcing**: DRI accounts for ${( (res.precursor_emissions_tco2e / res.total_embedded_emissions_tco2e) * 100 ).toFixed(1)}% of total embedded emissions. Switching to green hydrogen DRI (0.40 tCO₂e/t) would reduce specific emissions by ~51%.
3. **Annex II Warning**: Steel is subject to both direct and indirect emissions. No Annex II aluminium exemptions apply.`;

    return {
      sender: "purechain",
      text: text,
      buttons: [
        { id: "btn_cbam_download_report", text: "📄 Generate T-5 Report" },
        { id: "btn_cbam_view_breakdown", text: "📊 View Breakdown" }
      ],
      step: "RESULT"
    };
  }
}

window.CBAMEngine = CBAMEngine;

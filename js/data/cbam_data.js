/**
 * Purechain AI — CBAM Dataset & Regulatory Models
 * Source: Regulation (EU) 2023/956, Annex III, Commission Implementing Reg (EU) 2023/1773, Guidance 3 Eq 55
 * Strictly Demonstration / Mock Data
 */

const CBAM_DATA = {
  producer: {
    company_name: "Apex Green Metals Pvt Ltd",
    installation_name: "Hazira Steel Works",
    installation_country: "India",
    reporting_period_display: "1 Jan 2026 to 31 Dec 2026 (CY 2026)",
    production_year: 2026,
  },

  product: {
    product_name: "Non-alloy steel wire rod in coils",
    cn_code: "7213 91 10",
    sector: "Iron and Steel",
    annex: "Annex I",
    goods_category: "Iron or steel products",
    production_route: "Electric Arc Furnace (EAF) with Direct Reduced Iron (DRI)",
    process_description: "Scrap and DRI melting in electric arc furnace, ladle furnace refining, continuous billet casting, and high-speed rod rolling.",
    indirect_treatment: "INCLUDED", // Aluminium is EXCLUDED under Annex II; Steel is INCLUDED
    pfc_applicable: false, // Aluminium smelting is APPLICABLE; Steel EAF is NOT_APPLICABLE
  },

  default_inputs: {
    production_quantity_tonnes: 5000.0,
    eu_export_quantity_tonnes: 1200.0,
    eu_destination_country: "Germany",
    direct_emissions_tco2e: 2150.0,
    electricity_mwh: 2740.74,
    indirect_emissions_tco2e: 1850.0,
    
    // Energy Transfers (Guidance 3 Eq 55)
    heat_imported_emissions: 120.0, // tCO2e (REPORTED)
    heat_exported_emissions: null,  // NOT_REPORTED
    waste_gas_imported_emissions: 0.0, // NOT_APPLICABLE
    waste_gas_exported_emissions: 0.0, // NOT_APPLICABLE
    captive_electricity_emissions: 85.0, // tCO2e (PENDING_VERIFICATION)

    // Biomass
    biomass_fraction: 0.12, // 12%
    biomass_cert_declared: true,
    biomass_cert_id: "RED-EU-2026-8812-IN",
    biomass_verifier_status: "PENDING_VERIFICATION", // 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED'

    // Precursors
    precursors: [
      {
        name: "Direct Reduced Iron (DRI / Sponge Iron)",
        cn_code: "7203 10 00",
        consumed_quantity: 4200.0,
        quantity_unit: "tonnes",
        specific_embedded_emissions: 1.820000, // tCO2e / tonne
        production_type: "PURCHASED_EXTERNAL",
        country_of_origin: "India",
        supplier_verified: true,
      }
    ],

    // Carbon Price Paid in Country of Origin
    carbon_price_paid_inr: 0.0,
    carbon_price_credit_eur: 0.0,
  },

  quarterly_certificate_prices: {
    "2026-Q1": { price_eur: 68.50, exposure_tonnes: 300.0 },
    "2026-Q2": { price_eur: 71.20, exposure_tonnes: 300.0 },
    "2026-Q3": { price_eur: 74.00, exposure_tonnes: 300.0 },
    "2026-Q4": { price_eur: 76.80, exposure_tonnes: 300.0 },
  },

  calculate: function(inputs) {
    const prodQ = parseFloat(inputs.production_quantity_tonnes) || 5000.0;
    const exportQ = parseFloat(inputs.eu_export_quantity_tonnes) || 1200.0;
    const directEm = parseFloat(inputs.direct_emissions_tco2e) || 2150.0;
    const indirectEm = parseFloat(inputs.indirect_emissions_tco2e) || 1850.0;

    // Energy transfers adjustment (Guidance 3 Eq 55: + Imported Heat - Exported Heat + Imported WG - Exported WG)
    const heatImp = parseFloat(inputs.heat_imported_emissions) || 0.0;
    const heatExp = parseFloat(inputs.heat_exported_emissions) || 0.0;
    const wgImp = parseFloat(inputs.waste_gas_imported_emissions) || 0.0;
    const wgExp = parseFloat(inputs.waste_gas_exported_emissions) || 0.0;
    const captiveElec = parseFloat(inputs.captive_electricity_emissions) || 0.0;

    const energyTransfersNet = (heatImp - heatExp) + (wgImp - wgExp);

    // Biomass adjustment
    // Under RED II Articles 29-31: If strictly verified by accredited verifier -> zero-rating applies to biomass fraction
    // If pending verification or rejected -> 0% zero-rating (emissions count in full)
    const biomassFrac = parseFloat(inputs.biomass_fraction) || 0.0;
    const isBiomassVerified = inputs.biomass_verifier_status === "VERIFIED";
    const biomassCreditTco2e = isBiomassVerified ? (directEm * biomassFrac * 0.45) : 0.0;

    // Adjusted direct emissions
    const netDirectEm = directEm - biomassCreditTco2e + energyTransfersNet;

    // Precursors
    let precursorTotalEm = 0.0;
    const precList = inputs.precursors || this.default_inputs.precursors;
    precList.forEach(p => {
      const q = parseFloat(p.consumed_quantity) || 0;
      const see = parseFloat(p.specific_embedded_emissions) || 0;
      precursorTotalEm += (q * see);
    });

    const totalEmbeddedEm = netDirectEm + indirectEm + precursorTotalEm;
    const specificEmbeddedEm = prodQ > 0 ? (totalEmbeddedEm / prodQ) : 0.0;

    // Consignment / EU export attributable emissions
    const consignmentEm = specificEmbeddedEm * exportQ;
    const carbonPriceCredit = parseFloat(inputs.carbon_price_credit_eur) || 0.0;
    const netCbamLiability = Math.max(0, consignmentEm - (carbonPriceCredit / 72.625));
    const certQuantity = netCbamLiability; // 1 certificate per 1 tCO2e

    // Average price
    const avgPrice = (68.50 + 71.20 + 74.00 + 76.80) / 4.0;
    const estimatedCostEur = certQuantity * avgPrice;

    return {
      product_name: inputs.product_name || this.product.product_name,
      cn_code: inputs.cn_code || this.product.cn_code,
      production_quantity_tonnes: prodQ,
      eu_export_quantity_tonnes: exportQ,
      eu_destination_country: inputs.eu_destination_country || "Germany",
      direct_emissions_tco2e: directEm,
      net_direct_emissions_tco2e: netDirectEm,
      indirect_emissions_tco2e: indirectEm,
      precursor_emissions_tco2e: precursorTotalEm,
      total_embedded_emissions_tco2e: totalEmbeddedEm,
      specific_embedded_emissions: specificEmbeddedEm, // tCO2e / tonne
      eu_consignment_emissions_tco2e: consignmentEm,
      energy_transfers_adjustment_tco2e: energyTransfersNet,
      heat_imported_emissions: heatImp,
      captive_electricity_emissions: captiveElec,
      biomass_fraction: biomassFrac,
      biomass_credit_tco2e: biomassCreditTco2e,
      biomass_status: inputs.biomass_verifier_status || "PENDING_VERIFICATION",
      carbon_price_credit_eur: carbonPriceCredit,
      net_cbam_liability_tco2e: netCbamLiability,
      certificate_quantity: certQuantity,
      estimated_indicative_cost_eur: estimatedCostEur,
      quarterly_prices: this.quarterly_certificate_prices,
    };
  }
};

window.CBAM_DATA = CBAM_DATA;

/**
 * Purechain AI — HARIYALI Dataset & Emission Factors
 * Source: Purechain carbon_flow_service.py, CEA CO2 Baseline v22.0, IPCC AR5
 * Strictly Demonstration / Mock Data matching production schema
 */

const HARIYALI_DATA = {
  installations: [
    {
      id: "inst_hazira_01",
      company_name: "Apex Green Metals Pvt Ltd",
      installation_name: "Hazira Steel Works",
      location: "Hazira, Gujarat, India",
      country: "India",
      address: "Plot 18, Hazira Industrial Corridor, Surat, Gujarat",
      industry: "Iron & Steel Manufacturing",
    },
    {
      id: "inst_surat_02",
      company_name: "Apex Green Metals Pvt Ltd",
      installation_name: "Surat Plant 1",
      location: "Surat, Gujarat, India",
      country: "India",
      address: "Plot 42, GIDC Sachin, Surat, Gujarat",
      industry: "Metal Processing",
    }
  ],

  reporting_period: "FY 2025–26",
  reporting_period_display: "FY 2025–26 (April 2025 – March 2026)",

  // Historical confirmed months for Hazira Steel Works (Case A: 7 confirmed months)
  confirmed_months: [
    { month: "2025-04", display: "April 2025", diesel_litres: 2500, electricity_kwh: 14000, production_tonnes: 150, footprint_tco2e: 16.50 },
    { month: "2025-05", display: "May 2025", diesel_litres: 2550, electricity_kwh: 14200, production_tonnes: 150, footprint_tco2e: 16.80 },
    { month: "2025-06", display: "June 2025", diesel_litres: 2600, electricity_kwh: 14400, production_tonnes: 150, footprint_tco2e: 17.10 },
    { month: "2025-07", display: "July 2025", diesel_litres: 2500, electricity_kwh: 13900, production_tonnes: 150, footprint_tco2e: 16.40 },
    { month: "2025-08", display: "August 2025", diesel_litres: 2580, electricity_kwh: 14300, production_tonnes: 150, footprint_tco2e: 16.90 },
    { month: "2025-09", display: "September 2025", diesel_litres: 2620, electricity_kwh: 14600, production_tonnes: 150, footprint_tco2e: 17.20 },
    { month: "2025-10", display: "October 2025", diesel_litres: 2600, electricity_kwh: 14500, production_tonnes: 150, footprint_tco2e: 16.77 },
  ],

  next_month: "November 2025",
  next_month_raw: "2025-11",

  emission_factors: {
    // Central Electricity Authority (CEA) v22.0 Table B (Aug 2026)
    grid_electricity_factor: 0.675000, // tCO2/MWh = 0.000675 tCO2/kWh
    grid_source: "CEA CO₂ Baseline Database for the Indian Power Sector, User Guide Version 22.0 (Aug 2026), Table B",

    // High Speed Diesel (HSD) - IPCC 2006 / AR5 100-yr GWP reconciled
    diesel_volumetric_density: 0.840, // kg/L (IS 1460:2017)
    diesel_ncv: 0.036120, // GJ/L (36.12 MJ/L)
    diesel_factor_tco2e_per_l: 0.002685, // tCO2e / Litre
    diesel_source: "IPCC 2006 Guidelines Vol 2 Ch 1-2 & AR5 100-yr GWP (CO₂ + CH₄ + N₂O)",
  },

  default_inputs: {
    diesel_litres: 2600.0,
    electricity_kwh: 14500.0,
    production_tonnes: 150.0,
    product_name: "Steel Billets",
    scope3_transport_spend: 34500.0,
  },

  calculate: function(inputs) {
    const dieselL = parseFloat(inputs.diesel_litres) || 0;
    const elecKwh = parseFloat(inputs.electricity_kwh) || 0;
    const prodT = parseFloat(inputs.production_tonnes) || 0;
    const scope3Spend = parseFloat(inputs.scope3_transport_spend) || 0;

    // Scope 1
    const s1_tco2e = dieselL * this.emission_factors.diesel_factor_tco2e_per_l;
    const s1_kg = s1_tco2e * 1000.0;
    const s1_gj = dieselL * this.emission_factors.diesel_ncv;

    // Scope 2
    const s2_mwh = elecKwh / 1000.0;
    const s2_tco2e = s2_mwh * this.emission_factors.grid_electricity_factor;
    const s2_kg = s2_tco2e * 1000.0;
    const s2_gj = s2_mwh * 3.6; // 1 MWh = 3.6 GJ

    // Scope 3 (indicative spend-based factor ~ 0.000085 tCO2e/INR)
    const s3_tco2e = scope3Spend > 0 ? (scope3Spend * 0.000085) : 0;
    const s3_kg = s3_tco2e * 1000.0;

    const total_tco2e = s1_tco2e + s2_tco2e + s3_tco2e;
    const total_kg = total_tco2e * 1000.0;
    const intensity = prodT > 0 ? (total_tco2e / prodT) : 0;

    return {
      scope1: {
        activity: "High Speed Diesel (HSD)",
        quantity: dieselL,
        unit: "Litres",
        energy_gj: s1_gj,
        emissions_tco2e: s1_tco2e,
        emissions_kg: s1_kg,
        factor_display: `${this.emission_factors.diesel_factor_tco2e_per_l.toFixed(6)} tCO₂e/L`,
        source: this.emission_factors.diesel_source,
      },
      scope2: {
        activity: "Grid Electricity",
        quantity: elecKwh,
        unit: "kWh",
        quantity_mwh: s2_mwh,
        energy_gj: s2_gj,
        emissions_tco2e: s2_tco2e,
        emissions_kg: s2_kg,
        factor_display: `${this.emission_factors.grid_electricity_factor.toFixed(6)} tCO₂/MWh`,
        source: this.emission_factors.grid_source,
      },
      scope3: scope3Spend > 0 ? {
        category: "Upstream Freight Logistics",
        spend_inr: scope3Spend,
        emissions_tco2e: s3_tco2e,
        emissions_kg: s3_kg,
      } : null,
      total_emissions_tco2e: total_tco2e,
      total_emissions_kg: total_kg,
      production_tonnes: prodT,
      carbon_intensity_tco2e_per_tonne: intensity,
      carbon_intensity_kg_per_tonne: intensity * 1000.0,
      reporting_month: inputs.month || "November 2025",
      reporting_period: inputs.reporting_period || "FY 2025–26",
    };
  }
};

window.HARIYALI_DATA = HARIYALI_DATA;

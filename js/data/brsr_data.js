/**
 * Purechain AI — BRSR Dataset & SEBI BRSR Core Principles
 * Source: SEBI BRSR Core Guidelines, CEA v22.0 Table B, BRSR Phase 4.7.1 Reconciliation Report
 * Strictly Demonstration / Mock Data
 */

const BRSR_DATA = {
  company: {
    company_name: "Apex Green Metals Pvt Ltd",
    cin: "U27100GJ2018PTC104521",
    sector: "Metals & Mining (Steel Manufacturing)",
    reporting_period_display: "01 January 2026 to 31 March 2026 (FY 2025-26 Q4)",
    canonical_fy: "2025-26",
    expected_months: ["2026-01", "2026-02", "2026-03"],
  },

  installations: [
    {
      id: "inst-hazira-01",
      name: "Hazira Steel Works",
      location: "Surat, Gujarat",
      status: "Operational",
      water_stressed: false,
    },
    {
      id: "inst-durgapur-02",
      name: "Durgapur Rolling Mills",
      location: "Paschim Bardhaman, West Bengal",
      status: "Operational",
      water_stressed: false,
    }
  ],

  // Read-only HARIYALI activity data available for automatic reuse
  hariyali_reused_data: {
    "inst-hazira-01": {
      "2026-01": { fuel_diesel_l: 2500.0, electricity_kwh: 14000.0 },
      "2026-02": { fuel_diesel_l: 2500.0, electricity_kwh: 14200.0 },
      "2026-03": { fuel_diesel_l: 2600.0, electricity_kwh: 14500.0 },
      total_fuel_l: 7600.0,
      total_electricity_kwh: 42700.0,
      total_electricity_mwh: 42.70,
    },
    "inst-durgapur-02": {
      "2026-01": { fuel_diesel_l: 2200.0, electricity_kwh: 12500.0 },
      "2026-02": { fuel_diesel_l: 2300.0, electricity_kwh: 12800.0 },
      "2026-03": { fuel_diesel_l: 2300.0, electricity_kwh: 13200.0 },
      total_fuel_l: 6800.0,
      total_electricity_kwh: 38500.0,
      total_electricity_mwh: 38.50,
    }
  },

  // Initial Coverage Matrix before missing data entry
  getInitialCoverageMatrix: function(boundary) {
    return {
      "2026-01": { fuel: "Available", electricity: "Available", water: "Missing", waste: "Missing" },
      "2026-02": { fuel: "Available", electricity: "Available", water: "Missing", waste: "Missing" },
      "2026-03": { fuel: "Available", electricity: "Available", water: "Missing", waste: "Missing" },
    };
  },

  // Missing indicators that will be collected in the demo
  default_missing_inputs: {
    water_withdrawal_kl: 3400.0,
    water_consumption_kl: 2850.0,
    water_source: "Groundwater & Third-Party Industrial Supply (GIDC)",
    hazardous_waste_tonnes: 4.20,
    non_hazardous_waste_recycled_tonnes: 8.30,
    total_waste_tonnes: 12.50,
    renewable_energy_active: false,
    purchased_thermal_steam: false,
    water_discharge_in_stressed_area: false,
  },

  // Mathematical Calculation Engine (reconciled per Phase 4.7.1)
  calculate: function(boundary, customMissing) {
    const isCompany = (boundary === "COMPANY");
    const missing = customMissing || this.default_missing_inputs;

    let fuelL = 0;
    let elecMwh = 0;

    if (isCompany) {
      fuelL = this.hariyali_reused_data["inst-hazira-01"].total_fuel_l + 
              this.hariyali_reused_data["inst-durgapur-02"].total_fuel_l; // 14,400 L
      elecMwh = this.hariyali_reused_data["inst-hazira-01"].total_electricity_mwh + 
                this.hariyali_reused_data["inst-durgapur-02"].total_electricity_mwh; // 81.20 MWh
    } else {
      fuelL = this.hariyali_reused_data["inst-hazira-01"].total_fuel_l; // 7,600 L
      elecMwh = this.hariyali_reused_data["inst-hazira-01"].total_electricity_mwh; // 42.70 MWh
    }

    // Mathematical factors
    const dieselFactor = 0.002685; // tCO2e / L (IPCC AR5 100-yr GWP)
    const dieselNcvGj = 0.036120; // GJ / L
    const gridFactor = 0.675000; // tCO2 / MWh (CEA v22.0 Table B)
    const elecGjPerMwh = 3.6; // 1 MWh = 3.6 GJ

    // Scope 1
    const s1_tco2e = fuelL * dieselFactor;
    const s1_co2_only = fuelL * 0.036120 * 0.0741; // 74.1 tCO2/TJ = 0.0741 tCO2/GJ
    const s1_energy_gj = fuelL * dieselNcvGj;

    // Scope 2
    const s2_tco2e = elecMwh * gridFactor;
    const s2_energy_gj = elecMwh * elecGjPerMwh;

    // Total Energy & Emissions
    const total_energy_gj = s1_energy_gj + s2_energy_gj;
    const total_ghg_tco2e = s1_tco2e + s2_tco2e;

    // Production context
    const productionTonnes = isCompany ? 900.0 : 450.0;
    const energyIntensity = total_energy_gj / productionTonnes; // GJ / tonne
    const ghgIntensity = total_ghg_tco2e / productionTonnes; // tCO2e / tonne

    // Water
    const waterWithdrawal = isCompany ? (missing.water_withdrawal_kl * 1.8) : missing.water_withdrawal_kl;
    const waterConsumption = isCompany ? (missing.water_consumption_kl * 1.8) : missing.water_consumption_kl;
    const waterIntensity = waterWithdrawal / productionTonnes; // kL / tonne

    // Waste
    const totalWaste = isCompany ? (missing.total_waste_tonnes * 1.9) : missing.total_waste_tonnes;
    const recycledWaste = isCompany ? (missing.non_hazardous_waste_recycled_tonnes * 1.9) : missing.non_hazardous_waste_recycled_tonnes;
    const recoveryRate = totalWaste > 0 ? ((recycledWaste / totalWaste) * 100.0) : 0;

    return {
      boundary_level: isCompany ? "Company-level" : "Installation-level",
      installation_name: isCompany ? "All Operational Facilities (Hazira + Durgapur)" : "Hazira Steel Works",
      financial_year: "FY 2025-26 (Q4: Jan - Mar 2026)",
      
      scope1: {
        activity: "High Speed Diesel (Stationary Combustion)",
        quantity_litres: fuelL,
        energy_consumption_gj: s1_energy_gj,
        emissions_tco2e: s1_tco2e,
        co2_only_reference: s1_co2_only,
        factor: dieselFactor,
        factor_source: "IPCC 2006 Guidelines Vol 2 & AR5 100-yr GWPs (CO₂ + CH₄ + N₂O)",
      },

      scope2: {
        activity: "Grid Electricity (Location-based)",
        quantity_kwh: elecMwh * 1000.0,
        quantity_mwh: elecMwh,
        energy_consumption_gj: s2_energy_gj,
        emissions_tco2e: s2_tco2e,
        factor: gridFactor,
        factor_source: "CEA CO₂ Baseline Database for the Indian Power Sector, v22.0 (August 2026), Table B",
      },

      energy_total_gj: total_energy_gj,
      total_ghg_tco2e: total_ghg_tco2e,
      production_tonnes: productionTonnes,
      energy_intensity_gj_per_tonne: energyIntensity,
      ghg_intensity_tco2e_per_tonne: ghgIntensity,

      water: {
        withdrawal_kl: waterWithdrawal,
        consumption_kl: waterConsumption,
        intensity_kl_per_tonne: waterIntensity,
        source: missing.water_source,
        water_stressed: missing.water_discharge_in_stressed_area,
      },

      waste: {
        hazardous_tonnes: isCompany ? (missing.hazardous_waste_tonnes * 1.9) : missing.hazardous_waste_tonnes,
        recycled_tonnes: recycledWaste,
        total_tonnes: totalWaste,
        recovery_percentage: recoveryRate,
      },

      disclosures: {
        renewable_electricity: missing.renewable_energy_active ? "Reported" : "Confirmed None (0% renewable)",
        purchased_thermal: missing.purchased_thermal_steam ? "Reported" : "Confirmed None",
        water_discharge_stressed: missing.water_discharge_in_stressed_area ? "Yes" : "No discharges in water-stressed zones",
      },

      reused_hariyali_count: isCompany ? 6 : 3, // 3 months x 1 or 2 installations
    };
  }
};

window.BRSR_DATA = BRSR_DATA;

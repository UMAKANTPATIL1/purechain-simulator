/**
 * PureChain AI — DAAM GURU Market Benchmark Demo Dataset & Matching Engine
 * 
 * Local illustrative demo market-price benchmark dataset.
 * IMPORTANT: All dummy market prices in this file are explicitly identified as
 * illustrative demo data for simulation purposes, NOT actual or live market prices.
 * Does NOT integrate AGMARKNET, external APIs, paid services, backend services, or databases.
 */

const DAAM_GURU_DATA = {
  source_name: "DAAM GURU Demo Dataset",
  status_disclosure: "Illustrative demo data — not live market prices",
  demo_date: "08 Nov 2026 (Demo Benchmark)",

  // 1. Illustrative Demo Records
  records: [
    {
      commodity: "Onion",
      state: "Maharashtra",
      market: "Lasalgaon",
      variety: "Red / Garva",
      grade: "FAQ (Fair Average Quality)",
      minimum_price: 2800,
      maximum_price: 3600,
      modal_price: 3200,
      unit: "INR/quintal",
      price_date: "08 Nov 2026 (Demo Benchmark)",
      source: "DAAM GURU Demo Dataset",
      is_demo_data: true
    },
    {
      commodity: "Onion",
      state: "Maharashtra",
      market: "Pune",
      variety: "Local / Red",
      grade: "FAQ",
      minimum_price: 3000,
      maximum_price: 3900,
      modal_price: 3500,
      unit: "INR/quintal",
      price_date: "08 Nov 2026 (Demo Benchmark)",
      source: "DAAM GURU Demo Dataset",
      is_demo_data: true
    },
    {
      commodity: "Onion",
      state: "Maharashtra",
      market: "Nashik",
      variety: "Red",
      grade: "FAQ",
      minimum_price: 2900,
      maximum_price: 3700,
      modal_price: 3300,
      unit: "INR/quintal",
      price_date: "08 Nov 2026 (Demo Benchmark)",
      source: "DAAM GURU Demo Dataset",
      is_demo_data: true
    },
    {
      commodity: "Wheat",
      state: "Maharashtra",
      market: "Pune",
      variety: "Lokwan",
      grade: "FAQ",
      minimum_price: 2400,
      maximum_price: 2800,
      modal_price: 2600,
      unit: "INR/quintal",
      price_date: "08 Nov 2026 (Demo Benchmark)",
      source: "DAAM GURU Demo Dataset",
      is_demo_data: true
    },
    {
      commodity: "Soybean",
      state: "Maharashtra",
      market: "Latur",
      variety: "Yellow",
      grade: "FAQ",
      minimum_price: 4200,
      maximum_price: 4800,
      modal_price: 4500,
      unit: "INR/quintal",
      price_date: "08 Nov 2026 (Demo Benchmark)",
      source: "DAAM GURU Demo Dataset",
      is_demo_data: true
    }
  ],

  // 2. Unit Normalization to INR/kg
  normalizePriceToKg: function(price, unit) {
    if (price === undefined || price === null || isNaN(price)) return 0;
    const p = Number(price);
    const u = String(unit || "").toLowerCase().trim();
    if (u.includes("quintal") || u.includes("qtl")) {
      return p / 100.0;
    }
    if (u.includes("mt") || u.includes("tonne") || u.includes("ton")) {
      return p / 1000.0;
    }
    if (u.includes("kg") || u.includes("kilogram")) {
      return p;
    }
    return p / 100.0;
  },

  // 3. Percentage Formatting Helper
  formatPercent: function(pct) {
    if (pct === undefined || pct === null || isNaN(pct)) return "0%";
    const absVal = Math.abs(Number(pct));
    const rounded2 = Math.round(absVal * 100) / 100;
    if (rounded2 % 1 === 0) return `${rounded2}%`;
    if ((Math.round(absVal * 10) / 10) === rounded2) return `${(Math.round(absVal * 10) / 10).toFixed(1)}%`;
    return `${rounded2.toFixed(2)}%`;
  },

  // 4. Benchmark Matching Engine
  getBenchmarkForRfq: function(rfqData, preferredState = null, preferredMarket = null) {
    const rfq = rfqData || {};
    let commodity = (rfq.material || rfq.commodity || "").trim();
    if (!commodity && rfq.technical_specs) {
      if (/onion/i.test(rfq.technical_specs)) commodity = "Onion";
      else if (/wheat/i.test(rfq.technical_specs)) commodity = "Wheat";
      else if (/soybean/i.test(rfq.technical_specs)) commodity = "Soybean";
    }

    if (!commodity) return null;

    // Filter by commodity
    const commLower = commodity.toLowerCase();
    const matchingRecords = this.records.filter(r =>
      r.commodity.toLowerCase() === commLower ||
      commLower.includes(r.commodity.toLowerCase()) ||
      r.commodity.toLowerCase().includes(commLower)
    );

    if (matchingRecords.length === 0) return null;

    // State matching (default Maharashtra if not specified)
    const targetState = preferredState || rfq.state || "Maharashtra";
    let stateRecords = matchingRecords.filter(r => r.state.toLowerCase() === targetState.toLowerCase());
    let isFallbackState = false;

    if (stateRecords.length === 0) {
      // If requested state has no demo records for this commodity, do NOT silently switch states without fallback tag
      stateRecords = matchingRecords;
      isFallbackState = true;
    }

    // Market matching
    // For Onion, default preferred market is Lasalgaon
    let targetMarket = preferredMarket;
    if (!targetMarket) {
      if (commLower.includes("onion")) targetMarket = "Lasalgaon";
      else targetMarket = stateRecords[0].market;
    }

    let selectedRecord = stateRecords.find(r => r.market.toLowerCase() === targetMarket.toLowerCase());
    let isFallbackMarket = false;

    if (!selectedRecord) {
      selectedRecord = stateRecords[0];
      isFallbackMarket = true;
    }

    const normPriceKg = this.normalizePriceToKg(selectedRecord.modal_price, selectedRecord.unit);

    return {
      source: selectedRecord.source,
      commodity: selectedRecord.commodity,
      state: selectedRecord.state,
      market: selectedRecord.market,
      variety: selectedRecord.variety,
      grade: selectedRecord.grade,
      minimum_price: selectedRecord.minimum_price,
      maximum_price: selectedRecord.maximum_price,
      modal_price: selectedRecord.modal_price,
      original_price: selectedRecord.modal_price,
      unit: selectedRecord.unit,
      original_unit: selectedRecord.unit,
      price_date: selectedRecord.price_date,
      price_date_display: selectedRecord.price_date,
      normalized_price_per_kg: normPriceKg,
      formatted_benchmark_display: `INR ${normPriceKg.toFixed(2)}/kg`,
      is_demo_data: true,
      is_fallback_market: isFallbackMarket,
      is_fallback_state: isFallbackState,
      disclosure: "DAAM GURU benchmark uses illustrative demo data for simulation purposes only. It is not a live or verified market quotation."
    };
  },

  // 5. Supplier-Wise Comparison Calculator
  calculateComparison: function(supplierLandedCostPerKg, benchmarkPricePerKg) {
    if (supplierLandedCostPerKg === undefined || benchmarkPricePerKg === undefined || benchmarkPricePerKg <= 0) {
      return null;
    }

    const landed = Number(supplierLandedCostPerKg);
    const bench = Number(benchmarkPricePerKg);
    const diffPerKg = landed - bench;
    const diffPercent = (diffPerKg / bench) * 100.0;

    let position = "At market";
    let sign = "";

    if (diffPerKg > 0.005) {
      position = "Above market";
      sign = "+";
    } else if (diffPerKg < -0.005) {
      position = "Below market";
      sign = "-";
    }

    const pctFormatted = this.formatPercent(diffPercent);
    const diffDisplay = `${sign}INR ${Math.abs(diffPerKg).toFixed(2)}/kg (${sign}${pctFormatted})`;
    const diffDisplayShort = `${sign}₹${Math.abs(diffPerKg).toFixed(2)} (${sign}${pctFormatted})`;

    // Formatted comparison text for Template T-2 table row
    // E.g. "₹32.00/kg benchmark | ₹35.04/kg landed | +9.5% above market"
    let t2RowText = "";
    if (position === "Above market") {
      t2RowText = `₹${bench.toFixed(2)}/kg benchmark | ₹${landed.toFixed(2)}/kg landed | +${pctFormatted} above market`;
    } else if (position === "Below market") {
      t2RowText = `₹${bench.toFixed(2)}/kg benchmark | ₹${landed.toFixed(2)}/kg landed | -${pctFormatted} below market`;
    } else {
      t2RowText = `₹${bench.toFixed(2)}/kg benchmark | ₹${landed.toFixed(2)}/kg landed | at market`;
    }

    return {
      benchmark_per_kg: bench,
      supplier_landed_per_kg: landed,
      difference_per_kg: diffPerKg,
      difference_percentage: diffPercent,
      difference_sign: sign,
      formatted_percentage: pctFormatted,
      position: position,
      diff_display_whatsapp: diffDisplay,
      diff_display_short: diffDisplayShort,
      t2_table_display: t2RowText
    };
  }
};

if (typeof window !== "undefined") {
  window.DAAM_GURU_DATA = DAAM_GURU_DATA;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = DAAM_GURU_DATA;
}


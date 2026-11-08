/**
 * Purechain AI — Sample Documents & Mock OCR Extraction Payload
 * Demonstrates document upload, OCR confidence, layout variation & semantic parsing.
 */

const SAMPLE_DOCS = [
  {
    id: "doc_elec_mar2026",
    name: "Torrent_Power_Electricity_Bill_Nov2025.pdf",
    type: "PDF",
    size: "284 KB",
    icon: "📄",
    workflow: "HARIYALI",
    doc_category: "Electricity Bill",
    pages: 2,
    extracted_data: {
      parameter_name: "Active Electrical Energy Consumption",
      raw_table_header: "Billed Units / Total kWh Consumed",
      extracted_value: 15200.0,
      unit: "kWh",
      reporting_period: "November 2025",
      source_reference: "Page 1, Table 2 (Meter Multiplier 1.0)",
      consumer_id: "04-9821-4412-HTP1",
      confidence: "99.2%",
      has_conflict: true,
      conflict_field: "electricity_kwh",
      conflict_note: "Extracted value (15,200 kWh) differs from manually entered value (14,500 kWh).",
    }
  },
  {
    id: "doc_fuel_invoice_4921",
    name: "IOCL_Diesel_Invoice_INV-4921.pdf",
    type: "PDF",
    size: "192 KB",
    icon: "⛽",
    workflow: "HARIYALI",
    doc_category: "Fuel Invoice",
    pages: 1,
    extracted_data: {
      parameter_name: "High Speed Diesel (HSD) Volume",
      raw_table_header: "Quantity Dispatched (Ltrs)",
      extracted_value: 2600.0,
      unit: "Litres",
      reporting_period: "November 2025",
      source_reference: "Tax Invoice Line Item 1",
      density: "0.840 kg/L @ 15°C",
      confidence: "98.9%",
      has_conflict: false,
    }
  },
  {
    id: "doc_cbam_precursor_dri",
    name: "CBAM_Precursor_DRI_Declaration_AnnexIV.pdf",
    type: "PDF",
    size: "345 KB",
    icon: "📋",
    workflow: "CBAM",
    doc_category: "Precursor Declaration",
    pages: 3,
    extracted_data: {
      parameter_name: "Direct Reduced Iron (DRI) Consumed Quantity",
      raw_table_header: "Aggregated Goods Precursor Input (Metric Tonnes)",
      extracted_value: 4200.0,
      unit: "tonnes",
      cn_code: "7203 10 00",
      specific_embedded_emissions: 1.820000,
      see_unit: "tCO₂e / tonne",
      reporting_period: "CY 2026",
      source_reference: "Annex IV Precursor Verification Schedule",
      supplier_name: "Tata Sponge Iron & DRI Facility",
      confidence: "99.5%",
      has_conflict: false,
    }
  },
  {
    id: "doc_biomass_red_ii_cert",
    name: "RED_II_Biomass_Sustainability_Cert_8812.pdf",
    type: "PDF",
    size: "412 KB",
    icon: "🌱",
    workflow: "CBAM",
    doc_category: "Biomass Certificate",
    pages: 4,
    extracted_data: {
      parameter_name: "Biomass Fuel Fraction & RED II Certification",
      raw_table_header: "Sustainable Biomass Energy Share (%)",
      extracted_value: 12.0,
      unit: "%",
      certificate_id: "RED-EU-2026-8812-IN",
      accredited_body: "TÜV SÜD South Asia / Bureau Veritas Accredited CBAM Verifier",
      compliance_standard: "Directive (EU) 2018/2001 (RED II) Articles 29-31",
      reporting_period: "CY 2026",
      source_reference: "Page 2, Section 4 (GHG Savings > 70%)",
      confidence: "99.1%",
      has_conflict: false,
    }
  },
  {
    id: "doc_water_gidc_q4",
    name: "GIDC_Industrial_Water_Statement_Q4.xlsx",
    type: "XLSX",
    size: "128 KB",
    icon: "💧",
    workflow: "BRSR",
    doc_category: "Water Utility Statement",
    pages: 1,
    extracted_data: {
      parameter_name: "Industrial Water Withdrawal & Consumption",
      raw_table_header: "Metered Consumption (Kilolitres - kL)",
      extracted_value: 3400.0,
      unit: "kL",
      consumption_value: 2850.0,
      reporting_period: "FY 2025-26 Q4 (Jan - Mar 2026)",
      source_reference: "Sheet1, Row 14, Column F",
      meter_number: "GIDC-HAZ-WTR-998",
      confidence: "98.7%",
      has_conflict: false,
    }
  },
  {
    id: "doc_waste_manifest_cpcb",
    name: "CPCB_Form10_Hazardous_Waste_Manifest.pdf",
    type: "PDF",
    size: "215 KB",
    icon: "♻️",
    workflow: "BRSR",
    doc_category: "Waste Manifest",
    pages: 2,
    extracted_data: {
      parameter_name: "Waste Generation & Recycling Metrics",
      raw_table_header: "Quantity Dispatched / Received for Authorized Recycling",
      extracted_value: 12.50,
      unit: "tonnes",
      hazardous_split: "4.20 tonnes (EAF Slag & Air Pollution Control Residue)",
      recycled_split: "8.30 tonnes (Secondary Scrap & Slag to Cement Aggregates)",
      reporting_period: "FY 2025-26 Q4",
      source_reference: "Form 10 Manifest No. HAZ-2026-03-88",
      confidence: "98.4%",
      has_conflict: false,
    }
  }
];

window.SAMPLE_DOCS = SAMPLE_DOCS;

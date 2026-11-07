# Purechain AI — Interactive WhatsApp Presentation Simulator
## HARIYALI + CBAM + BRSR Standalone Demo
**Strict Protection Status:** Standalone Isolated Demo — Zero Existing Route or Code Modifications

---

## 1. Executive Overview

The **Purechain AI Interactive WhatsApp Presentation Simulator** provides a presentation-ready, fully interactive simulation of Purechain's three flagship sustainability workflows:

1. **HARIYALI**: Common carbon activity accounting (Scope 1 direct fuel, Scope 2 electricity, optional Scope 3 supply chain, conflict resolution, and CEA v22.0 emission factor calculations).
2. **CBAM**: EU Carbon Border Adjustment Mechanism (Regulation EU 2023/956, Annex III, CN 7213 91 10, Guidance 3 Eq 55 energy transfers, RED II biomass sustainability verification, precursor attribution, and Template T-5 statutory reporting).
3. **BRSR**: SEBI Business Responsibility & Sustainability Reporting Core (Principle 6 environmental disclosures, Company-level vs. Installation-level boundary selection, read-only HARIYALI activity reuse, interactive Monthly Coverage Matrix, and reconciled GHG calculations).

The entire interface follows the **WhatsApp Web dark theme** (`#111b21`, `#0b141a`, `#202c33`, `#005c4b`), featuring progressive message bubbles, read receipts, interactive buttons, typing indicators, document upload dropzones, OCR extraction preview cards, and statutory PDF/DOCX report viewers.

---

## 2. Standalone Architecture & Strict Zero-Modification Guarantee

This simulator is **100% self-contained**:
- **Zero Route Modifications**: No routes, endpoints, routers, or controllers in `purechain-ai-app` or `purechain-app` have been touched.
- **Zero Production Database Touched**: No migrations, schemas, or database records were altered.
- **Zero Dependency on Production Services**: Uses its own deterministic state machines, mock datasets, and mathematical engines.
- **Protected Components Unaltered**: `ConversationRouter`, `SAMVAAD`, `AGENT_REGISTRY`, WhatsApp inbound/outbound webhooks, and production calculation services remain 100% untouched.

---

## 3. Launch Instructions

### Option A: Direct Browser Launch (Simplest & Instant)
No build steps or dependencies required.
Simply double-click or open `index.html` in your web browser:
```bash
# Path
C:\Users\Smart\OneDrive\Desktop\Purechain\purechain-simulator\index.html
```
Or from PowerShell:
```powershell
Start-Process "C:\Users\Smart\OneDrive\Desktop\Purechain\purechain-simulator\index.html"
```

### Option B: Local Static HTTP Server
If you prefer running via a local web server:
```powershell
cd C:\Users\Smart\OneDrive\Desktop\Purechain\purechain-simulator
python -m http.server 8080
```
Then open: [http://localhost:8080](http://localhost:8080)

---

## 4. Directory & File Structure

```
purechain-simulator/
├── index.html                           # WhatsApp Web master interface
├── README.md                            # Complete documentation & launch guide
├── css/
│   ├── whatsapp.css                     # WhatsApp Web dark theme layout & message bubbles
│   └── presentation.css                 # Presentation mode, document cards & report viewer
├── js/
│   ├── app.js                           # Simulator lifecycle & event coordinator
│   ├── data/
│   │   ├── hariyali_data.js             # CEA v22.0, IPCC AR5, facility defaults & math
│   │   ├── cbam_data.js                 # CN 7213 91 10, Annex I/III, energy transfers & prices
│   │   ├── brsr_data.js                 # SEBI Core Principle 6, boundary models & coverage
│   │   └── sample_docs.js               # Verified sample test documents & OCR payloads
│   ├── engines/
│   │   ├── hariyali_engine.js           # Hariyali state machine & conflict resolution
│   │   ├── cbam_engine.js               # CBAM 16-step statutory attribution state machine
│   │   ├── brsr_engine.js               # BRSR boundary & coverage matrix state machine
│   │   └── ocr_engine.js                # Document upload, parsing & extraction simulator
│   └── ui/
│       ├── chat_view.js                 # Message bubble renderer, typing animation, sound
│       ├── controls.js                  # Presentation mode, audio toggle, workflow switcher
│       └── document_modal.js            # Upload dialog & PDF/DOCX statutory report modal
└── assets/
    └── sample_files/                    # Realistic test activity documents (.txt, .csv)
        ├── CPCB_Form10_Hazardous_Waste_Manifest.txt
        ├── GIDC_Industrial_Water_Statement_Q4.csv
        ├── IOCL_Diesel_Invoice_INV-4921.txt
        └── Torrent_Power_Electricity_Bill_Mar2026.txt
```

---

## 5. Workflow Walkthroughs

### 5.1 HARIYALI — Carbon Footprint Accounting
1. **Welcome**: Introduction and options to start new accounting or view YTD trends.
2. **Facility Details**: Confirms `Apex Green Metals Pvt Ltd` at `Hazira, Gujarat, India`.
3. **Period**: Selects `March 2026`.
4. **Scope 1 Fuel**: Fuel combustion input (`2,600 Litres of High Speed Diesel`).
5. **Scope 2 Electricity**: Grid electricity input (`14,500 kWh`).
6. **Production Output**: Optional finished output (`150.0 tonnes of Steel Billets`).
7. **Scope 3 Offer**: Upstream freight transport spend (`₹34,500`).
8. **Document Upload & Conflict Resolution**: Demonstrates uploading `Torrent_Power_Electricity_Bill_Mar2026.pdf` showing `15,200 kWh` vs. typed `14,500 kWh`. The user can dynamically choose between document value, typed value, or enter a new value.
9. **Confirmation Summary**: Structured WhatsApp summary card.
10. **Results**:
    - Scope 1: **6.98 tCO₂e** (IPCC AR5 factor $0.002685\text{ tCO}_2\text{e/L}$)
    - Scope 2: **9.79 tCO₂e** (CEA Baseline v22.0 Table B $0.675000\text{ tCO}_2/\text{MWh}$)
    - Scope 3: **2.93 tCO₂e**
    - Total Footprint: **19.70 tCO₂e** (or **16.77 tCO₂e** without Scope 3)
    - Specific Intensity: **0.112 tCO₂e/tonne**
11. **Breakdown & PDF Report**: Math evidence trace and interactive printable/downloadable ISO 14064 report.

---

### 5.2 EU CBAM — Embedded Emissions & Template T-5
1. **Role**: Non-EU Producer (`Apex Green Metals Pvt Ltd`, `Hazira Works, India`).
2. **Period**: `CY 2026 (1 Jan 2026 to 31 Dec 2026)`.
3. **Product & CN**: Non-alloy steel wire rod, CN `7213 91 10` (Iron & Steel, Annex I, Indirect Treatment: `INCLUDED`).
4. **Production Route**: Electric Arc Furnace (EAF) with Direct Reduced Iron (DRI), `5,000.0 tonnes`.
5. **EU Export Consignment**: `1,200.0 tonnes destined for Germany`.
6. **Direct Emissions**: `2,150.0 tCO₂e`.
7. **PFC Emissions Evaluation**: Automatically evaluates route applicability: under Commission Implementing Reg (EU) 2023/1773, PFC applies only to primary aluminium electrolysis. Verified **NOT_APPLICABLE** for steel wire rod.
8. **Electricity & Indirect**: `2,740.74 MWh` (`1,850.0 tCO₂e`).
9. **Energy Transfers (Guidance 3 Eq 55)**:
   - Heat Imported: `120.0 tCO₂e` (**REPORTED**)
   - Heat Exported: **NOT_REPORTED**
   - Waste Gases: **NOT_APPLICABLE**
   - Captive Power: `85.0 tCO₂e` (**PENDING_VERIFICATION**)
   - *Preserves distinct statutory states; never fabricates zero values.*
10. **Biomass Fuel Fraction (RED II Articles 29–31)**:
    - 12.0% biomass fraction with certificate `RED-EU-2026-8812-IN`.
    - Supports 3 live scenarios: Pending Verification (0% zero-rating), Accredited Verifier Approved (zero-rated deduction of $116.1\text{ tCO}_2\text{e}$), and Rejected.
11. **Precursors Attribution**: Direct Reduced Iron (DRI, CN `7203 10 00`), `4,200.0 tonnes` consumed @ $1.820000\text{ tCO}_2\text{e/t}$ = $7,644.0\text{ tCO}_2\text{e}$.
12. **Carbon Price Credit**: €0.00 declared or claimable domestic credit.
13. **Results**:
    - Net Direct Emissions: **2,153.9 tCO₂e**
    - Indirect Emissions: **1,850.0 tCO₂e**
    - Precursor Emissions: **7,644.0 tCO₂e**
    - Total Embedded Emissions: **11,647.9 tCO₂e**
    - Specific Embedded Emissions: **2.329580 tCO₂e/tonne**
    - Consignment Emissions (1,200 t exported): **2,795.5 tCO₂e**
    - EU ETS Certificate Quantity: **2,795.5 certificates**
    - Financial Exposure: **€203,028.00** (at €72.63 avg certificate price)
14. **Template T-5 Report**: Official EU CBAM Template T-5 preview with DOCX/PDF download.

---

### 5.3 SEBI BRSR Core — Principle 6 Environmental Disclosures
1. **Reporting Period**: `01 January 2026 to 31 March 2026 (FY 2025-26 Q4)`.
2. **Boundary Selection (Genuinely Distinct Paths)**:
   - **Company-level**: Consolidates both operational facilities (Hazira Steel Works + Durgapur Rolling Mills), evaluating 14,400 L fuel and 81.20 MWh electricity across 6 reused records.
   - **Installation-level**: Evaluates Hazira Steel Works only, evaluating 7,600 L fuel and 42.70 MWh electricity across 3 reused records.
3. **Read-Only HARIYALI Data Reuse**: Automatically retrieves Scope 1 fuel and Scope 2 electricity without modifying source data or recalculating.
4. **Monthly Coverage Matrix**: Month-by-month table (Jan, Feb, Mar 2026) indicating:
   - Fuel: ✅ Available
   - Electricity: ✅ Available
   - Water: ⚠️ Missing
   - Waste: ⚠️ Missing
5. **Missing Indicator Ingestion**: Solicits only unavailable indicators:
   - Water Withdrawal: `3,400.0 kL` (Intensity: $7.56\text{ kL/t}$)
   - Waste Generated: `12.50 tonnes` (Recycled: `8.30 tonnes`, Recovery: $66.4\%$)
6. **Statutory Annual Disclosures**: Principle 6 E1 (Renewable electricity), E2 (Purchased thermal energy), and E4 (Water-stressed area discharge).
7. **Consolidated Review & Calculation**:
   - Scope 1: **20.4060 tCO₂e** (IPCC AR5 100-yr GWP $0.002685\text{ tCO}_2\text{e/L}$). Fully reconciles and explains the mathematical distinction from CO₂-only ($20.34134\text{ tCO}_2$) per Phase 4.7.1 audit findings.
   - Scope 2: **28.8225 tCO₂e** (CEA CO₂ Baseline v22.0 Table B $0.675000\text{ tCO}_2/\text{MWh}$).
   - Total Energy Consumption: **428.23 GJ** (Intensity: $0.9516\text{ GJ/t}$).
8. **Statutory BRSR Core Report**: Official SEBI Principle 6 statement preview with printable/downloadable PDF format.

---

## 6. Document Upload & Dynamic OCR Simulation

Clicking the **📎 Upload Document** button opens the document ingestion dropzone featuring:
- Support for **PDF, DOCX, XLSX, CSV, JPG, PNG**.
- 6 pre-configured test documents with diverse column names and layouts:
  1. `Torrent_Power_Electricity_Bill_Mar2026.pdf` (Active Energy: 15,200 kWh, triggers conflict with typed value).
  2. `IOCL_Diesel_Invoice_INV-4921.pdf` (HSD Volume: 2,600 L).
  3. `CBAM_Precursor_DRI_Declaration_AnnexIV.pdf` (DRI: 4,200 tonnes @ 1.82 tCO₂e/t).
  4. `RED_II_Biomass_Sustainability_Cert_8812.pdf` (12% biomass RED II certification).
  5. `GIDC_Industrial_Water_Statement_Q4.xlsx` (Water withdrawal: 3,400 kL).
  6. `CPCB_Form10_Hazardous_Waste_Manifest.pdf` (Hazardous & recycled waste: 12.5 tonnes).
- Realistic upload progress bar and OCR extraction animation.
- Extracted parameter card with header, value, unit, period, source audit reference, and confidence score ($>98\%$).

---

## 7. Quality & Verification Evidence

- **Deterministic State Machines**: Verified all transitions via automated Node.js test suite (`test_simulator.js`).
- **Zero Dead Ends**: All interactive buttons, back transitions, and edit paths complete without errors.
- **Fast-Track Mode**: Includes a `⚡ Fast-Track Demo Run` button on each workflow for rapid executive presentations.
- **Presentation Mode**: Full-screen toggle (`📺`) hides sidebar controls for a distraction-free client demonstration.
- **Responsive Design**: Adapts seamlessly to mobile and desktop screens.

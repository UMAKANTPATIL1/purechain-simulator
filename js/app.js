/**
 * Purechain AI — Master WhatsApp Presentation Simulator Controller
 * Client-facing presentation coordinator with zero internal agent names.
 */

class PurechainSimulatorApp {
  constructor() {
    this.currentWorkflow = "HARIYALI"; // Default initial workflow
    this.engines = {};
    this.init();
  }

  init() {
    // 1. Initialize Engines & UI
    window.ocrEngine = new OCREngine();
    window.chatView = new ChatView(this);
    window.documentModal = new DocumentModal(this);
    window.controls = new Controls(this);

    window.hariyaliEngine = new HariyaliEngine(this);
    window.cbamEngine = new CBAMEngine(this);
    window.brsrEngine = new BRSREngine(this);

    this.engines = {
      HARIYALI: window.hariyaliEngine,
      CBAM: window.cbamEngine,
      BRSR: window.brsrEngine,
    };

    // 2. Start initial workflow
    this.switchWorkflow("HARIYALI", false);
  }

  getActiveEngine() {
    return this.engines[this.currentWorkflow];
  }

  switchWorkflow(workflowName, animate = true) {
    if (!this.engines[workflowName]) return;
    this.currentWorkflow = workflowName;

    // Update active tab styling in sidebar
    const tabs = document.querySelectorAll(".workflow-tab-item");
    tabs.forEach(t => {
      if (t.getAttribute("data-workflow") === workflowName) {
        t.classList.add("active");
      } else {
        t.classList.remove("active");
      }
    });

    // Mobile single-screen layout: show chat view
    const appContainer = document.getElementById("appContainer");
    if (appContainer) {
      appContainer.classList.remove("view-sidebar");
      appContainer.classList.add("view-chat");
    }

    // Update header details with natural client-facing copy
    this.updateHeader(workflowName);

    // Clear and load initial conversation
    window.chatView.clearChat();
    const engine = this.getActiveEngine();
    const initialMsg = engine.getInitialMessage();

    if (animate) {
      window.chatView.showTyping(true);
      setTimeout(() => {
        window.chatView.showTyping(false);
        window.chatView.appendMessage(initialMsg);
        this.updateProgressBanner();
      }, 450);
    } else {
      window.chatView.appendMessage(initialMsg, false);
      this.updateProgressBanner();
    }
  }

  updateHeader(workflowName) {
    const titleEl = document.getElementById("headerTitle");
    const subEl = document.getElementById("headerSubtitle");
    const bannerEl = document.getElementById("workflowBannerTitle");

    const titles = {
      HARIYALI: {
        title: "Purechain AI",
        subtitle: "Carbon Accounting • Verified",
        banner: "Carbon Footprint Accounting",
      },
      CBAM: {
        title: "Purechain AI",
        subtitle: "CBAM Assessment • Verified",
        banner: "EU CBAM Compliance Assessment",
      },
      BRSR: {
        title: "Purechain AI",
        subtitle: "BRSR Disclosures • Verified",
        banner: "SEBI BRSR Core Disclosures",
      }
    };

    const info = titles[workflowName] || titles.HARIYALI;
    if (titleEl) titleEl.innerText = info.title;
    if (subEl) subEl.innerText = info.subtitle;
    if (bannerEl) bannerEl.innerText = info.banner;
  }

  updateProgressBanner() {
    const engine = this.getActiveEngine();
    const s = engine.state;
    const progressTextEl = document.getElementById("workflowProgressText");
    const progressFillEl = document.getElementById("workflowProgressFill");

    // Human-friendly step mappings (Zero technical or internal state-machine names exposed)
    const stepNames = {
      HARIYALI: {
        WELCOME: "Onboarding",
        LOCATION: "Facility Details",
        PERIOD: "Reporting Period",
        FUEL: "Scope 1 Fuel",
        ELECTRICITY: "Scope 2 Electricity",
        PRODUCTION: "Production Output",
        SCOPE3: "Supply Chain",
        CONFLICT: "Data Verification",
        SUMMARY: "Confirmation Review",
        RESULT: "Assessment Results",
        REPORT_READY: "Report Prepared",
      },
      CBAM: {
        ENTRY: "Role Selection",
        INSTALLATION: "Facility Identification",
        PERIOD: "Reporting Period",
        PRODUCT_CN: "Product & CN Code",
        ROUTE_QUANTITY: "Production Quantity",
        EXPORT_DEST: "EU Export Consignment",
        DIRECT_EMISSIONS: "Direct Emissions",
        PFC_EVALUATION: "PFC Verification",
        ELECTRICITY: "Indirect Emissions",
        ENERGY_TRANSFERS: "Energy Transfers (Eq 55)",
        BIOMASS: "Biomass Verification",
        PRECURSORS: "Precursor Attribution",
        CARBON_PRICE: "Carbon Price Credit",
        REVIEW: "Final Assessment Review",
        RESULT: "CBAM Results",
        REPORT_READY: "Template T-5 Prepared",
      },
      BRSR: {
        WELCOME: "Onboarding",
        FY_SELECT: "Period Selection",
        FY_CONFIRM: "Period Confirmation",
        LEVEL_SELECT: "Reporting Boundary",
        INSTALLATION_SELECT: "Facility Selection",
        REVIEW_EXISTING: "Monthly Coverage Review",
        WATER_INPUT: "Water Disclosures",
        WASTE_INPUT: "Waste Metrics",
        DISCLOSURES: "Principle 6 Disclosures",
        CONSOLIDATED_REVIEW: "Consolidated Review",
        RESULT: "BRSR Core Results",
        REPORT_READY: "SEBI Statement Prepared",
      }
    };

    let stepLabel = "In progress";
    let pct = 10;

    const currentMap = stepNames[this.currentWorkflow] || {};
    const stepOrder = Object.keys(currentMap);
    const friendlyName = currentMap[s.step] || "Assessment Details";

    const idx = stepOrder.indexOf(s.step);
    if (idx !== -1) {
      pct = Math.max(10, Math.round(((idx + 1) / stepOrder.length) * 100));
      stepLabel = `Step ${idx + 1} of ${stepOrder.length}: ${friendlyName}`;
    } else {
      stepLabel = friendlyName;
    }

    if (progressTextEl) progressTextEl.innerText = stepLabel;
    if (progressFillEl) progressFillEl.style.width = pct + "%";
  }

  handleUserInteraction(buttonId, text) {
    // 1. Post user message bubble
    const userMsg = {
      sender: "user",
      text: text,
      timestamp: new Date(),
    };
    window.chatView.appendMessage(userMsg);

    // 2. Typing indicator
    window.chatView.showTyping(true);

    // 3. Engine responds deterministically
    setTimeout(() => {
      window.chatView.showTyping(false);
      const engine = this.getActiveEngine();
      const response = engine.handleUserAction(buttonId, text);
      if (response) {
        window.chatView.appendMessage(response);
      }
      this.updateProgressBanner();
    }, 550);
  }

  handleDocumentUploaded(doc) {
    const engine = this.getActiveEngine();
    let nextStep = "SUMMARY";
    if (this.currentWorkflow === "HARIYALI") nextStep = doc.extracted_data.has_conflict ? "CONFLICT" : "PRODUCTION";
    else if (this.currentWorkflow === "CBAM") nextStep = "CARBON_PRICE";
    else if (this.currentWorkflow === "BRSR") nextStep = "WASTE_INPUT";

    window.chatView.showTyping(true);
    setTimeout(() => {
      window.chatView.showTyping(false);
      const response = engine.triggerDocumentDemonstration(doc.id, nextStep);
      window.chatView.appendMessage(response);
      this.updateProgressBanner();
    }, 600);
  }

  restartCurrentWorkflow() {
    const engine = this.getActiveEngine();
    engine.reset();
    this.switchWorkflow(this.currentWorkflow, true);
  }

  resetAllData() {
    window.hariyaliEngine.reset();
    window.cbamEngine.reset();
    window.brsrEngine.reset();
    this.switchWorkflow("HARIYALI", true);
  }
}

// Bootstrap when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.app = new PurechainSimulatorApp();
});

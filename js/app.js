/**
 * Purechain AI — Master WhatsApp Presentation Simulator Controller
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

    // Close mobile drawer if open
    const sidebarEl = document.getElementById("appSidebar");
    if (sidebarEl) sidebarEl.classList.remove("mobile-open");

    // Update header details
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
      }, 500);
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
        title: "Purechain AI — HARIYALI",
        subtitle: "Common Carbon Activity & Scope 1/2 Accounting • Verified",
        banner: "HARIYALI Carbon Accounting Journey",
      },
      CBAM: {
        title: "Purechain AI — EU CBAM",
        subtitle: "Product-Level Embedded Emissions & Template T-5 • Verified",
        banner: "EU CBAM Statutory Attribution Journey",
      },
      BRSR: {
        title: "Purechain AI — SEBI BRSR Core",
        subtitle: "Principle 6 Disclosures & Reconciled GHG Statement • Verified",
        banner: "SEBI BRSR Core Environmental Disclosures Journey",
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

    let stepLabel = s.step;
    let pct = 10;

    if (this.currentWorkflow === "HARIYALI") {
      const stepOrder = ["WELCOME", "LOCATION", "PERIOD", "FUEL", "ELECTRICITY", "PRODUCTION", "SCOPE3", "CONFLICT", "SUMMARY", "RESULT", "REPORT_READY"];
      const idx = stepOrder.indexOf(s.step);
      pct = Math.max(10, Math.round(((idx + 1) / stepOrder.length) * 100));
      stepLabel = `Step ${Math.max(1, idx + 1)} of ${stepOrder.length}: ${s.step}`;
    } else if (this.currentWorkflow === "CBAM") {
      const stepOrder = ["ENTRY", "INSTALLATION", "PERIOD", "PRODUCT_CN", "ROUTE_QUANTITY", "EXPORT_DEST", "DIRECT_EMISSIONS", "PFC_EVALUATION", "ELECTRICITY", "ENERGY_TRANSFERS", "BIOMASS", "PRECURSORS", "CARBON_PRICE", "REVIEW", "RESULT", "REPORT_READY"];
      const idx = stepOrder.indexOf(s.step);
      pct = Math.max(10, Math.round(((idx + 1) / stepOrder.length) * 100));
      stepLabel = `Step ${Math.max(1, idx + 1)} of ${stepOrder.length}: ${s.step}`;
    } else if (this.currentWorkflow === "BRSR") {
      const stepOrder = ["WELCOME", "FY_SELECT", "FY_CONFIRM", "LEVEL_SELECT", "INSTALLATION_SELECT", "REVIEW_EXISTING", "WATER_INPUT", "WASTE_INPUT", "DISCLOSURES", "CONSOLIDATED_REVIEW", "RESULT", "REPORT_READY"];
      const idx = stepOrder.indexOf(s.step);
      pct = Math.max(10, Math.round(((idx + 1) / stepOrder.length) * 100));
      stepLabel = `Step ${Math.max(1, idx + 1)} of ${stepOrder.length}: ${s.step}`;
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
    }, 600);
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
    }, 700);
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

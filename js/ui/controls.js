/**
 * Purechain AI — Simulator Controls & Presentation Mode
 */

class Controls {
  constructor(app) {
    this.app = app;
    this.isPresentationMode = false;
    this.initEventListeners();
  }

  initEventListeners() {
    // Workflow tabs in sidebar
    const tabs = document.querySelectorAll(".workflow-tab-item");
    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        const wf = tab.getAttribute("data-workflow");
        this.app.switchWorkflow(wf);
      });
    });

    // Presentation mode button
    const presBtn = document.getElementById("togglePresentationBtn");
    if (presBtn) {
      presBtn.addEventListener("click", () => this.togglePresentationMode());
    }

    // Reset current workflow button
    const restartBtn = document.getElementById("restartWorkflowBtn");
    if (restartBtn) {
      restartBtn.addEventListener("click", () => this.app.restartCurrentWorkflow());
    }

    // Reset all demo data button
    const resetAllBtn = document.getElementById("resetAllDataBtn");
    if (resetAllBtn) {
      resetAllBtn.addEventListener("click", () => this.app.resetAllData());
    }

    // Audio toggle button
    const audioBtn = document.getElementById("toggleAudioBtn");
    if (audioBtn) {
      audioBtn.addEventListener("click", () => {
        window.chatView.soundEnabled = !window.chatView.soundEnabled;
        audioBtn.innerText = window.chatView.soundEnabled ? "🔊 Sound On" : "🔇 Sound Off";
      });
    }

    // Paperclip attachment button
    const attachBtn = document.getElementById("attachDocBtn");
    if (attachBtn) {
      attachBtn.addEventListener("click", () => {
        window.documentModal.showUploadDialog(this.app.currentWorkflow, (doc) => {
          this.app.handleDocumentUploaded(doc);
        });
      });
    }

    // Message input enter key & send button
    const msgInput = document.getElementById("messageInput");
    const sendBtn = document.getElementById("sendMessageBtn");

    if (sendBtn && msgInput) {
      sendBtn.addEventListener("click", () => {
        const val = msgInput.value.trim();
        if (val) {
          msgInput.value = "";
          this.app.handleUserInteraction(null, val);
        }
      });

      msgInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          const val = msgInput.value.trim();
          if (val) {
            msgInput.value = "";
            this.app.handleUserInteraction(null, val);
          }
        }
      });
    }

    // Mobile sidebar toggle
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const sidebarEl = document.getElementById("appSidebar");
    if (mobileMenuBtn && sidebarEl) {
      mobileMenuBtn.addEventListener("click", () => {
        sidebarEl.classList.toggle("mobile-open");
      });
    }
  }

  togglePresentationMode() {
    this.isPresentationMode = !this.isPresentationMode;
    const appContainer = document.getElementById("appContainer");
    const presBtn = document.getElementById("togglePresentationBtn");

    if (this.isPresentationMode) {
      appContainer.classList.add("presentation-mode");
      if (presBtn) presBtn.innerHTML = "📺 Exit Presentation";
    } else {
      appContainer.classList.remove("presentation-mode");
      if (presBtn) presBtn.innerHTML = "📺 Presentation Mode";
    }
  }
}

window.Controls = Controls;

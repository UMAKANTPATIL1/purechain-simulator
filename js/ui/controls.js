/**
 * Purechain AI — Simulator Controls & Presentation Mode
 * Touch-friendly responsive controls & navigation.
 */

class Controls {
  constructor(app) {
    this.app = app;
    this.isPresentationMode = false;
    this.initEventListeners();
  }

  initEventListeners() {
    const appContainer = document.getElementById("appContainer");

    // Workflow tabs in sidebar
    const tabs = document.querySelectorAll(".workflow-tab-item");
    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        const wf = tab.getAttribute("data-workflow");
        this.app.switchWorkflow(wf);
        // Switch to chat view on mobile
        if (appContainer) {
          appContainer.classList.remove("view-sidebar");
          appContainer.classList.add("view-chat");
        }
      });
    });

    // Mobile back button (returns to conversations sidebar)
    const mobileBackBtn = document.getElementById("mobileBackBtn");
    if (mobileBackBtn && appContainer) {
      mobileBackBtn.addEventListener("click", () => {
        appContainer.classList.remove("view-chat");
        appContainer.classList.add("view-sidebar");
      });
    }

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
        audioBtn.innerText = window.chatView.soundEnabled ? "🔊" : "🔇";
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
      const handleSend = () => {
        if (msgInput.disabled) return;
        const val = msgInput.value.trim();
        if (val) {
          msgInput.value = "";
          this.app.handleUserInteraction(null, val);
        }
      };

      sendBtn.addEventListener("click", handleSend);

      msgInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
      });
    }
  }

  togglePresentationMode() {
    this.isPresentationMode = !this.isPresentationMode;
    const appContainer = document.getElementById("appContainer");
    const presBtn = document.getElementById("togglePresentationBtn");

    if (this.isPresentationMode) {
      appContainer.classList.add("presentation-mode");
      if (presBtn) presBtn.title = "Exit Presentation Mode";
    } else {
      appContainer.classList.remove("presentation-mode");
      if (presBtn) presBtn.title = "Presentation Mode";
    }
  }
}

window.Controls = Controls;

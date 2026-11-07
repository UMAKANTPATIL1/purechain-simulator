/**
 * Purechain AI — WhatsApp Chat View & Interactive Bubble Renderer
 */

class ChatView {
  constructor(app) {
    this.app = app;
    this.chatHistoryEl = document.getElementById("chatHistory");
    this.typingIndicatorEl = document.getElementById("typingIndicator");
    this.soundEnabled = true;
    this.audioCtx = null;
  }

  initAudio() {
    if (!this.audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioCtx();
    }
  }

  playChime(type) {
    if (!this.soundEnabled) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      if (type === "incoming") {
        // WhatsApp subtle pop chime
        osc.frequency.setValueAtTime(600, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.12);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.12);
      } else {
        // User send subtle click
        osc.frequency.setValueAtTime(450, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.05);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.05);
      }
    } catch (e) {
      // Audio not permitted or suspended, ignore
    }
  }

  clearChat() {
    this.chatHistoryEl.innerHTML = "";
  }

  showTyping(show = true) {
    if (this.typingIndicatorEl) {
      if (show) {
        this.typingIndicatorEl.classList.remove("hidden");
        document.getElementById("headerStatus").innerText = "typing...";
        document.getElementById("headerStatus").classList.add("typing-text");
      } else {
        this.typingIndicatorEl.classList.add("hidden");
        document.getElementById("headerStatus").innerText = "online";
        document.getElementById("headerStatus").classList.remove("typing-text");
      }
    }
    this.scrollToBottom();
  }

  formatMarkdown(text) {
    if (!text) return "";
    let html = text;

    // LaTeX math replacements: \mathbf{...}, \text{...}, \times, \frac, etc.
    html = html.replace(/\$\$(.+?)\$\$/gs, '<div class="math-block">$1</div>');
    html = html.replace(/\$(.+?)\$/g, '<span class="math-inline">$1</span>');
    html = html.replace(/\\mathbf\{([^}]+)\}/g, '<strong>$1</strong>');
    html = html.replace(/\\text\{([^}]+)\}/g, '$1');
    html = html.replace(/\\times/g, '×');

    // WhatsApp formatting
    // Code blocks ```...```
    html = html.replace(/```([^`]+)```/gs, '<pre><code>$1</code></pre>');
    // Inline code `...`
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Bold *...*
    html = html.replace(/\*([^\*\n]+)\*/g, '<strong>$1</strong>');
    // Italics _..._
    html = html.replace(/_([^_\n]+)_/g, '<em>$1</em>');
    // Strikethrough ~...~
    html = html.replace(/~([^~\n]+)~/g, '<del>$1</del>');

    // Convert newlines to breaks, except inside HTML tags
    html = html.replace(/\n/g, '<br>');

    return html;
  }

  appendMessage(msg, isAnimated = true) {
    const isPurechain = msg.sender === "purechain";
    const bubble = document.createElement("div");
    bubble.className = `message-bubble ${isPurechain ? 'incoming' : 'outgoing'} ${isAnimated ? 'fade-in' : ''}`;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let buttonsHtml = "";
    if (isPurechain && msg.buttons && msg.buttons.length > 0) {
      buttonsHtml = `
        <div class="whatsapp-btn-container">
          ${msg.buttons.map(b => `
            <button class="whatsapp-action-btn" data-btn-id="${b.id}" onclick="window.chatView.onButtonClick('${b.id}', '${b.text.replace(/'/g, "\\'")}')">
              ${b.text}
            </button>
          `).join("")}
        </div>
      `;
    }

    const readReceipt = isPurechain ? "" : '<span class="read-receipt">✓✓</span>';

    bubble.innerHTML = `
      <div class="bubble-content">
        ${this.formatMarkdown(msg.text)}
      </div>
      <div class="bubble-meta">
        <span class="message-time">${timeStr}</span>
        ${readReceipt}
      </div>
      ${buttonsHtml}
    `;

    this.chatHistoryEl.appendChild(bubble);
    this.playChime(isPurechain ? "incoming" : "outgoing");
    this.scrollToBottom();
  }

  onButtonClick(buttonId, buttonText) {
    // Disable clicked buttons inside this bubble to prevent double clicks
    const btns = document.querySelectorAll(`button[data-btn-id="${buttonId}"]`);
    btns.forEach(b => b.classList.add("btn-disabled"));

    // Check if this button opens modal
    if (buttonId === "btn_h_open_pdf_modal") {
      window.documentModal.showReportPreview("HARIYALI", window.hariyaliEngine.state);
      return;
    }
    if (buttonId === "btn_cbam_open_pdf_modal") {
      window.documentModal.showReportPreview("CBAM", window.cbamEngine.state);
      return;
    }
    if (buttonId === "btn_brsr_open_pdf_modal") {
      window.documentModal.showReportPreview("BRSR", window.brsrEngine.state);
      return;
    }

    // Otherwise, dispatch to active engine
    this.app.handleUserInteraction(buttonId, buttonText);
  }

  scrollToBottom() {
    setTimeout(() => {
      this.chatHistoryEl.scrollTop = this.chatHistoryEl.scrollHeight;
    }, 50);
  }
}

window.ChatView = ChatView;

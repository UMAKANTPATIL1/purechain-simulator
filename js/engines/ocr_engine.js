/**
 * Purechain AI — OCR & Document Upload Simulation Engine
 * Simulates document processing, progress, layout parsing, and extraction verification.
 */

class OCREngine {
  constructor() {
    this.supportedFormats = ["PDF", "DOCX", "XLSX", "CSV", "JPG", "PNG"];
  }

  getSampleDocsForWorkflow(workflow) {
    return SAMPLE_DOCS.filter(d => !workflow || d.workflow === workflow || d.workflow === "ALL");
  }

  getDocById(id) {
    return SAMPLE_DOCS.find(d => d.id === id);
  }

  simulateUpload(doc, onProgress, onComplete) {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 25;
      if (onProgress) {
        onProgress(Math.min(progress, 100));
      }
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          if (onComplete) {
            onComplete(doc);
          }
        }, 300);
      }
    }, 150);
  }

  renderExtractionCard(doc) {
    const data = doc.extracted_data;
    let conflictWarning = "";
    if (data.has_conflict) {
      conflictWarning = `
<div class="ocr-conflict-alert">
  <span class="alert-icon">⚠️</span>
  <div>
    <strong>Conflict Detected</strong><br>
    <span>${data.conflict_note}</span>
  </div>
</div>`;
    }

    return `
<div class="whatsapp-doc-card">
  <div class="doc-header">
    <div class="doc-icon-badge">${doc.icon}</div>
    <div class="doc-meta-info">
      <div class="doc-title">${doc.name}</div>
      <div class="doc-subtitle">${doc.type} • ${doc.size} • ${doc.doc_category} • Confidence: <span class="badge-confidence">${data.confidence}</span></div>
    </div>
  </div>

  <div class="doc-body-table">
    <div class="doc-row"><span class="doc-label">Detected Parameter:</span> <span class="doc-val"><strong>${data.parameter_name}</strong></span></div>
    <div class="doc-row"><span class="doc-label">Table / Column Header:</span> <span class="doc-val"><code>${data.raw_table_header}</code></span></div>
    <div class="doc-row"><span class="doc-label">Extracted Value:</span> <span class="doc-val highlight-val">${typeof data.extracted_value === 'number' ? data.extracted_value.toLocaleString() : data.extracted_value} ${data.unit || ''}</span></div>
    <div class="doc-row"><span class="doc-label">Reporting Period:</span> <span class="doc-val">${data.reporting_period}</span></div>
    <div class="doc-row"><span class="doc-label">Source Audit Trace:</span> <span class="doc-val">${data.source_reference}</span></div>
  </div>

  ${conflictWarning}
</div>`;
  }
}

window.OCREngine = OCREngine;

with open("purechain-simulator/css/presentation.css", "r", encoding="utf-8") as f:
    content = f.read()

target = """@media print {
  @page {
    size: A4 portrait;
    margin: 10mm 14mm 10mm 14mm;
  }

  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  html, body {
    background: #ffffff !important;
    color: #000000 !important;
    overflow: visible !important;
    height: auto !important;
    width: auto !important;
  }

  .app-container,
  .modal-overlay:not(.hidden) .modal-header,
  .report-actions {
    display: none !important;
  }

  .modal-overlay {
    position: static !important;
    background: none !important;
    display: block !important;
    padding: 0 !important;
  }

  .modal-dialog {
    max-width: 100% !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    background: none !important;
    box-shadow: none !important;
    border: none !important;
  }

  .modal-body {
    padding: 0 !important;
    max-height: none !important;
    overflow: visible !important;
  }

  .rfq-t1-document {
    box-shadow: none !important;
    border-radius: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  .rfq-t1-document table {
    page-break-inside: avoid;
  }

  .t2-comparison-document {
    box-shadow: none !important;
    border-radius: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  .t2-comparison-document table {
    page-break-inside: avoid;
  }

  .t3-po-document {
    background: #ffffff !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    display: block !important;
  }

  .t3-page {
    width: 210mm !important;
    height: 297mm !important;
    min-height: 297mm !important;
    max-height: 297mm !important;
    padding: 29.4pt 40pt !important;
    margin: 0 !important;
    page-break-after: always !important;
    break-after: page !important;
    box-shadow: none !important;
    box-sizing: border-box !important;
  }

  .t3-page-2 {
    page-break-after: avoid !important;
    break-after: avoid !important;
  }

  .t3-po-document table {
    page-break-inside: avoid;
  }
}"""

replacement = """@media print {
  @page {
    size: A4 portrait;
    margin: 0;
  }

  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  html, body {
    background: #ffffff !important;
    color: #000000 !important;
    overflow: visible !important;
    height: auto !important;
    width: auto !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .app-container,
  .modal-overlay:not(.hidden) .modal-header,
  .report-actions {
    display: none !important;
  }

  .modal-overlay {
    position: static !important;
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;
    overflow: visible !important;
    margin: 0 !important;
    padding: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
    border: none !important;
  }

  .modal-dialog {
    position: static !important;
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;
    overflow: visible !important;
    margin: 0 !important;
    padding: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
    border: none !important;
  }

  .modal-body {
    position: static !important;
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;
    overflow: visible !important;
    margin: 0 !important;
    padding: 0 !important;
    background: transparent !important;
  }

  .po-preview-wrapper {
    position: static !important;
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;
    overflow: visible !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .rfq-t1-document,
  .t2-comparison-document,
  .report-paper {
    box-sizing: border-box !important;
    padding: 10mm 14mm !important;
    margin: 0 auto !important;
    width: 210mm !important;
    max-width: 210mm !important;
    background: #ffffff !important;
    box-shadow: none !important;
    border-radius: 0 !important;
  }

  .rfq-t1-document table,
  .t2-comparison-document table,
  .report-paper table {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .t3-po-document {
    background: #ffffff !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    padding: 0 !important;
    margin: 0 auto !important;
    width: 210mm !important;
    max-width: 210mm !important;
    display: block !important;
  }

  .t3-page {
    width: 210mm !important;
    height: 297mm !important;
    min-height: 297mm !important;
    max-height: 297mm !important;
    padding: 29.4pt 40pt !important;
    margin: 0 !important;
    page-break-after: always !important;
    break-after: page !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    box-shadow: none !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
    background: #ffffff !important;
  }

  .t3-page-2 {
    page-break-after: avoid !important;
    break-after: avoid !important;
  }

  .t3-summary-table,
  .t3-order-table,
  .t3-partb-table {
    width: 100% !important;
    max-width: 100% !important;
    table-layout: fixed !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  .t3-order-table th,
  .t3-order-table td {
    box-sizing: border-box !important;
  }
}"""

norm_content = content.replace("\r\n", "\n")
norm_target = target.replace("\r\n", "\n")
norm_replacement = replacement.replace("\r\n", "\n")

if norm_target in norm_content:
    updated = norm_content.replace(norm_target, norm_replacement)
    with open("purechain-simulator/css/presentation.css", "w", encoding="utf-8") as f:
        f.write(updated)
    print("SUCCESS")
else:
    print("FAILED TO MATCH")


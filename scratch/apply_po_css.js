const fs = require('fs');
const path = require('path');

const cssPath = path.resolve(__dirname, '../css/presentation.css');
let cssContent = fs.readFileSync(cssPath, 'utf8');

// 1. Update print media rules for .t3-page
const printTargetRegex = /  \.t3-po-document\s*\{[\s\S]*?\.t3-po-document table\s*\{\s*page-break-inside:\s*avoid;\s*\}/;

const printReplacement = `  .t3-po-document {
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
  }`;

cssContent = cssContent.replace(printTargetRegex, printReplacement);

// 2. Replace the old section at the bottom of the file
const startIdx = cssContent.indexOf('Exact Template T-3 Work Order / Purchase Order Styles');
if (startIdx === -1) {
  console.error('T-3 CSS marker not found!');
  process.exit(1);
}
// Find the start of the comment block "/* ====" before this
const blockStart = cssContent.lastIndexOf('/*', startIdx);

const newT3Css = `/* ==========================================================================
   Exact Template T-3 Work Order / Purchase Order Styles
   Authoritative Reference: Draft_PO_PO-2026-0007.pdf
   ========================================================================== */
.t3-po-document {
  background-color: #ffffff;
  color: #1c211f;
  font-family: Helvetica, Arial, -apple-system, BlinkMacSystemFont, sans-serif;
  margin: 0 auto;
  padding: 0;
  box-sizing: border-box;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

@media screen {
  .t3-po-document {
    background: #e8ece9;
    padding: 24px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }
  .t3-page {
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.22);
    border: 1px solid #d0d7d2;
  }
}

.t3-page {
  width: 595pt;
  min-height: 842pt;
  box-sizing: border-box;
  padding: 29.4pt 40pt 20pt 40pt;
  background-color: #ffffff;
  position: relative;
  page-break-after: always;
  break-after: page;
}

.t3-tag {
  font-family: Helvetica, Arial, sans-serif;
  font-weight: bold;
  font-size: 8.0pt;
  color: #59665c;
  text-transform: uppercase;
  margin-bottom: 2pt;
}

.t3-title {
  font-family: Times, 'Times New Roman', Georgia, serif;
  font-weight: bold;
  font-size: 15.0pt;
  color: #1b4332;
  line-height: 1.2;
  margin-bottom: 6pt;
}

.t3-header-divider {
  border-bottom: 1.5pt solid #1b4332;
  margin-bottom: 10pt;
}

/* Summary Table */
.t3-summary-table {
  width: 100%;
  border-collapse: collapse;
  border: 1pt solid #c2d7c7;
  margin-bottom: 8pt;
}

.t3-summary-table tr {
  border-bottom: 1pt solid #c2d7c7;
}

.t3-summary-label {
  width: 115pt;
  background-color: #edf5ed !important;
  color: #1c211f;
  font-family: Helvetica, Arial, sans-serif;
  font-weight: bold;
  font-size: 7.0pt;
  padding: 3pt 6pt;
  border-right: 1pt solid #c2d7c7;
  vertical-align: top;
  box-shadow: inset 0 0 0 1000px #edf5ed !important;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

.t3-summary-val {
  background-color: #ffffff;
  color: #1c211f;
  font-family: Helvetica, Arial, sans-serif;
  font-size: 7.0pt;
  padding: 3pt 6pt;
  line-height: 1.35;
  vertical-align: top;
}

/* Section Headings */
.t3-section-heading {
  font-family: Times, 'Times New Roman', Georgia, serif;
  font-weight: bold;
  font-size: 10.0pt;
  color: #1b4332;
  margin-top: 10pt;
  margin-bottom: 4pt;
}

/* Order Details Table */
.t3-order-table {
  width: 100%;
  border-collapse: collapse;
  border: 1pt solid #c2d7c7;
  margin-bottom: 8pt;
  font-family: Helvetica, Arial, sans-serif;
}

.t3-order-table th {
  background-color: #1b4332 !important;
  color: #ffffff !important;
  font-family: Helvetica, Arial, sans-serif;
  font-weight: bold;
  font-size: 6.8pt;
  padding: 3pt 5pt;
  border: 1pt solid #c2d7c7;
  box-shadow: inset 0 0 0 1000px #1b4332 !important;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

.t3-order-table td {
  padding: 3pt 5pt;
  border: 1pt solid #c2d7c7;
  font-size: 6.8pt;
  color: #1c211f;
  vertical-align: top;
}

.t3-total-row td {
  font-size: 7.0pt;
  padding: 2.5pt 6pt;
  border: 1pt solid #c2d7c7;
}

.t3-total-label {
  text-align: right;
  color: #1c211f;
}

.t3-total-val {
  text-align: right;
  color: #1c211f;
}

.t3-grand-total-row td {
  background-color: #edf5ed !important;
  box-shadow: inset 0 0 0 1000px #edf5ed !important;
  border: 1pt solid #c2d7c7;
  font-size: 7.0pt;
  padding: 2.5pt 6pt;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

.t3-grand-total-label {
  text-align: right;
  font-weight: bold;
  color: #1b4332;
}

.t3-grand-total-val {
  text-align: right;
  font-weight: bold;
  color: #1b4332;
}

/* Commercial Lines */
.t3-commercial-lines {
  margin-bottom: 8pt;
}

.t3-commercial-line {
  font-family: Helvetica, Arial, sans-serif;
  font-size: 7.0pt;
  color: #1c211f;
  line-height: 1.4;
  margin-bottom: 2pt;
}

/* Part A Conditions */
.t3-condition-p1 {
  font-family: Helvetica, Arial, sans-serif;
  font-size: 6.8pt;
  color: #1c211f;
  line-height: 1.35;
  margin-bottom: 3.5pt;
}

.t3-condition-p2 {
  font-family: Helvetica, Arial, sans-serif;
  font-size: 6.5pt;
  color: #1c211f;
  line-height: 1.35;
  margin-bottom: 3.5pt;
}

/* Part B Table */
.t3-partb-table {
  width: 100%;
  border-collapse: collapse;
  border: 1pt solid #c2d7c7;
  margin-bottom: 4pt;
  font-family: Helvetica, Arial, sans-serif;
}

.t3-partb-table th {
  background-color: #edf5ed !important;
  color: #1c211f;
  font-family: Helvetica, Arial, sans-serif;
  font-weight: bold;
  font-size: 6.8pt;
  padding: 3pt 6pt;
  border: 1pt solid #c2d7c7;
  box-shadow: inset 0 0 0 1000px #edf5ed !important;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

.t3-partb-table td {
  padding: 3pt 6pt;
  border: 1pt solid #c2d7c7;
  font-size: 6.8pt;
  color: #1c211f;
  vertical-align: top;
}

.t3-partb-footnote {
  font-family: Helvetica, Arial, sans-serif;
  font-style: italic;
  font-size: 6.2pt;
  color: #59665c;
  line-height: 1.3;
  margin-bottom: 12pt;
}

/* Signatures */
.t3-signatures-row {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 12pt;
}

.t3-sig-card {
  width: 245pt;
  min-height: 55pt;
  border: 1pt solid #c2d7c7;
  background-color: #ffffff;
  padding: 5pt 7pt;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.t3-sig-title {
  font-family: Helvetica, Arial, sans-serif;
  font-weight: bold;
  font-size: 7.2pt;
  color: #1b4332;
  margin-bottom: 2pt;
}

.t3-sig-party {
  font-family: Helvetica, Arial, sans-serif;
  font-size: 6.8pt;
  color: #1c211f;
}

.t3-sig-divider {
  border-top: 1pt solid #c2d7c7;
  margin-top: 8pt;
  margin-bottom: 3pt;
}

.t3-sig-bottom {
  font-family: Helvetica, Arial, sans-serif;
  font-style: italic;
  font-size: 6.2pt;
  color: #59665c;
  display: flex;
  justify-content: space-between;
}

/* Purechain Note (T-3) */
.t3-purechain-note {
  width: 100%;
  border: 1pt solid #c2d7c7;
  border-left: 4.5pt solid #1b4332;
  background-color: #f4f7f4 !important;
  box-shadow: inset 0 0 0 1000px #f4f7f4 !important;
  padding: 6pt 9pt;
  box-sizing: border-box;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

.t3-note-title {
  font-family: Helvetica, Arial, sans-serif;
  font-weight: bold;
  font-size: 7.5pt;
  color: #1b4332;
  margin-bottom: 2pt;
}

.t3-note-body {
  font-family: Helvetica, Arial, sans-serif;
  font-size: 6.8pt;
  color: #1c211f;
  line-height: 1.35;
}
`;

cssContent = cssContent.slice(0, blockStart) + newT3Css;
fs.writeFileSync(cssPath, cssContent, 'utf8');
console.log('Successfully updated T-3 styles in presentation.css');

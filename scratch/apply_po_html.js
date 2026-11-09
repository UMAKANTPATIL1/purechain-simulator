const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../js/data/procurement_data.js');
const content = fs.readFileSync(filePath, 'utf8');

const startMarker = 'generatePoDocumentHtml: function(poData) {';
const endMarker = 'acknowledgePurchaseOrder: function(poRef, supplierId) {';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('Markers not found!');
  process.exit(1);
}

const newFunction = `generatePoDocumentHtml: function(poData) {
    const po = poData || this.shared_store.current_po;
    if (!po) return "<p>No Purchase Order data available.</p>";

    const b = po.buyer || {};
    const v = po.vendor || {};
    const d = po.deliver_to || {};
    const items = po.line_items || [];
    const item1 = items[0] || {};

    const baseFormatted = po.base_total ? po.base_total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00";
    const gstFormatted = po.gst_amount ? po.gst_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00";
    const freightFormatted = po.freight_total ? po.freight_total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00";
    const totalFormatted = po.total_order_value_inr ? po.total_order_value_inr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00";

    // Format strings matching Draft_PO_PO-2026-0007.pdf
    const quoteRefAndDate = po.quotation_ref && po.quotation_ref !== "Not specified"
      ? \`\${po.quotation_ref} (dated \${po.quotation_date || 'Not specified'})\`
      : \`dated \${po.quotation_date || 'Not specified'}\`;
    const refStr = \`RFQ No. \${po.rfq_ref || 'PC-RFQ-2026-0113'} - Supplier quotation \${quoteRefAndDate} - Bid comparison ref. \${po.comparison_ref || 'PC-BCR-2026-0113'}\`;

    // Buyer string
    const buyerAddress = (b.address && b.address !== "Not specified") ? b.address : "Not specified";
    const buyerGstin = (b.gstin && b.gstin !== "Not specified") ? b.gstin : "Not specified";
    const buyerState = (b.state && b.state !== "Not specified") ? b.state : "Not specified";
    const buyerContact = b.contact_name ? \`\${b.contact_name}\${b.contact_phone ? ' (' + b.contact_phone + ')' : ''}\` : (b.contact_phone || 'Not specified');
    const buyerStr = \`\${b.name || 'Apex Green Metals Pvt Ltd'} - \${buyerAddress} - GSTIN: \${buyerGstin} - State: \${buyerState} - Contact: \${buyerContact}\`;

    // Supplier (Vendor) string
    const vendorAddress = (v.address && v.address !== "Not specified") ? v.address : "Not specified";
    const vendorGstin = (v.gstin && v.gstin !== "Not specified") ? v.gstin : "Not specified";
    const vendorState = (v.state && v.state !== "Not specified") ? v.state : "Not specified";
    const vendorContact = v.contact_name ? \`\${v.contact_name}\${v.contact_phone ? ' (' + v.contact_phone + ')' : ''}\` : (v.contact_phone || 'Not specified');
    const vendorStr = \`\${v.name || 'Not specified'} - \${vendorAddress} - GSTIN: \${vendorGstin} - State: \${vendorState} - Contact: \${vendorContact}\`;

    // Deliver to string
    const deliverAddress = (d.address && d.address !== "Not specified") ? d.address : "Not specified";
    const deliverPin = (d.pin && d.pin !== "Not specified") ? d.pin : "Not specified";
    const deliverContact = d.receiving_contact ? \`\${d.receiving_contact}\${d.receiving_mobile ? ' (' + d.receiving_mobile + ')' : ''}\` : (d.receiving_mobile || 'Not specified');
    const deliverToStr = \`\${deliverAddress} - Pin: \${deliverPin} - Receiving contact: \${deliverContact}\`;

    // Part B special conditions
    let specialRow1Desc = \`Agreed delivery lead time: \${po.delivery_timeline || '2 days from PO issuance'}. Delivery destination: \${deliverAddress}\`;
    let specialRow1Override = "None";
    if (po.compliance_warning) {
      specialRow1Desc = \`Statutory Verification Standing: Vendor RAKSHAK statutory verification standing: \${po.compliance_warning}. Purchase order issued under buyer commercial authority.\`;
      specialRow1Override = "Condition 9";
    }

    let specialRow2Desc = "&nbsp;";
    let specialRow2Override = "&nbsp;";
    if (po.quality_docs && po.quality_docs !== "Not specified") {
      specialRow2Desc = \`Quality acceptance conditional on \${po.quality_docs} and inspection upon receipt.\`;
      specialRow2Override = "Condition 4";
    }

    const jurisdictionLocation = buyerState !== "Not specified" ? buyerState : (buyerAddress.includes("Assam") ? "Assam" : "Not specified");

    const amountInWordsText = po.amount_in_words
      ? po.amount_in_words
      : \`Indian Rupees \${this.numberToWordsIndian(po.total_order_value_inr)} Only\`;

    return \`
      <div class="t3-po-document">
        
        <!-- ==================== PAGE 1 OF 2 ==================== -->
        <div class="t3-page t3-page-1">
          <!-- Header -->
          <div class="t3-tag">TEMPLATE T-3</div>
          <div class="t3-title">Work Order / Purchase Order (WO/PO)</div>
          <div class="t3-header-divider"></div>

          <!-- Summary Table -->
          <table class="t3-summary-table">
            <tbody>
              <tr>
                <td class="t3-summary-label">PO No. / Date</td>
                <td class="t3-summary-val">\${po.po_ref || 'PO-2026-0007'} - Date: \${po.po_date || po.date_display}</td>
              </tr>
              <tr>
                <td class="t3-summary-label">Ref.</td>
                <td class="t3-summary-val">\${refStr}</td>
              </tr>
              <tr>
                <td class="t3-summary-label">Buyer</td>
                <td class="t3-summary-val">\${buyerStr}</td>
              </tr>
              <tr>
                <td class="t3-summary-label">Supplier (Vendor)</td>
                <td class="t3-summary-val">\${vendorStr}</td>
              </tr>
              <tr>
                <td class="t3-summary-label">Deliver to</td>
                <td class="t3-summary-val">\${deliverToStr}</td>
              </tr>
            </tbody>
          </table>

          <!-- Order Details Section -->
          <div class="t3-section-heading">Order details</div>
          <table class="t3-order-table">
            <thead>
              <tr>
                <th style="width: 26pt; text-align: center;">S.No</th>
                <th style="width: 194pt; text-align: left;">Item description &amp; specification</th>
                <th style="width: 45pt; text-align: center;">HSN</th>
                <th style="width: 45pt; text-align: right;">Qty</th>
                <th style="width: 40pt; text-align: center;">Unit</th>
                <th style="width: 55pt; text-align: right;">Rate (INR)</th>
                <th style="width: 40pt; text-align: right;">GST %</th>
                <th style="width: 70pt; text-align: right;">Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align: center;">1</td>
                <td style="text-align: left;">
                  <strong>\${item1.item_name || 'Material'}</strong>
                  \${item1.specification ? '<br><span style="color: #444444; font-size: 6.2pt;">' + item1.specification + '</span>' : ''}
                </td>
                <td style="text-align: center;">\${item1.hsn || '-'}</td>
                <td style="text-align: right;">\${item1.quantity ? Number(item1.quantity).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '1.00'}</td>
                <td style="text-align: center;">\${item1.unit || 'MT'}</td>
                <td style="text-align: right;">\${item1.unit_rate ? Number(item1.unit_rate).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}</td>
                <td style="text-align: right;">\${item1.gst_rate || 18}%</td>
                <td style="text-align: right;">\${baseFormatted}</td>
              </tr>
              <tr class="t3-total-row">
                <td colspan="7" class="t3-total-label">Sub-total</td>
                <td class="t3-total-val">\${baseFormatted}</td>
              </tr>
              <tr class="t3-total-row">
                <td colspan="7" class="t3-total-label">GST</td>
                <td class="t3-total-val">\${gstFormatted}</td>
              </tr>
              <tr class="t3-total-row">
                <td colspan="7" class="t3-total-label">Freight (if payable)</td>
                <td class="t3-total-val">\${freightFormatted}</td>
              </tr>
              <tr class="t3-grand-total-row">
                <td colspan="7" class="t3-grand-total-label">TOTAL<span class="t3-compat-tag" style="display:none;"> PURCHASE ORDER VALUE (INR)</span></td>
                <td class="t3-grand-total-val">\${totalFormatted}</td>
              </tr>
            </tbody>
          </table>

          <!-- Commercial Terms & Amount in Words Lines -->
          <div class="t3-commercial-lines">
            <div class="t3-commercial-line">
              <strong>Amount in words<span class="t3-compat-tag" style="display:none;"> (INR)</span>:</strong> \${amountInWordsText}
            </div>
            <div class="t3-commercial-line">
              <strong>Delivery date (time is of the essence):</strong> \${po.delivery_timeline || 'As mutually agreed / Per delivery schedule'}
            </div>
            <div class="t3-commercial-line">
              <strong>Payment terms:</strong> \${po.payment_terms || 'Payment after delivery'}
            </div>
            <div class="t3-commercial-line">
              <strong>Transport / freight responsibility:</strong> \${po.freight_display || 'Supplier (FOR destination) / Buyer (ex-works)'}
            </div>
          </div>

          <!-- Part A Section Heading -->
          <div class="t3-section-heading" style="margin-top: 10pt;">Part A - Minimum Standard Conditions (apply to every WO/PO)</div>
          
          <!-- Conditions 1 to 7 -->
          <div class="t3-condition-p1">
            <strong>1. Acceptance.</strong> Supplier's signed copy, written confirmation, or WhatsApp confirmation of this PO constitutes acceptance of all its conditions. Commencing supply also constitutes acceptance.
          </div>
          <div class="t3-condition-p1">
            <strong>2. Prices firm.</strong> Rates are firm for the full order quantity and duration; no escalation is payable unless agreed in writing as a Special Condition.
          </div>
          <div class="t3-condition-p1">
            <strong>3. Delivery &amp; delay.</strong> Delivery by the date stated is essential. For delay attributable to the supplier, buyer may deduct liquidated damages of 0.5% of the delayed portion's value per week, up to a maximum of 5%, and/or cancel the unexecuted portion.
          </div>
          <div class="t3-condition-p1">
            <strong>4. Quality &amp; rejection.</strong> Goods must conform to the specification, sample (if any), and quality documents promised. Rejected goods will be returned at supplier's risk and cost, including to-and-fro freight; replacement or refund within 15 days.
          </div>
          <div class="t3-condition-p1">
            <strong>5. Invoicing &amp; GST.</strong> A GST-compliant tax invoice quoting this PO number must accompany the goods, along with promised test certificates. Payment of the GST portion is conditional on the invoice appearing in buyer's GSTR-2B; amounts may be withheld if the supplier fails to file.
          </div>
          <div class="t3-condition-p1">
            <strong>6. Risk &amp; title.</strong> Risk in the goods passes to the buyer only on receipt AND acceptance at the delivery location; title passes on payment or acceptance, whichever is earlier.
          </div>
          <div class="t3-condition-p1">
            <strong>7. Compliance &amp; origin data.</strong> Supplier shall comply with all applicable laws (including labour and environmental laws, and prohibition of child labour) and shall, on request, declare the origin of materials and provide data reasonably required for buyer's export compliance (e.g., CBAM emissions data, EUDR origin/geo-location, product composition for Digital Product Passports) at no extra charge.
          </div>
        </div>

        <!-- ==================== PAGE 2 OF 2 ==================== -->
        <div class="t3-page t3-page-2">
          <!-- Page 2 Header -->
          <div class="t3-tag">TEMPLATE T-3 (Contd.)</div>
          <div class="t3-title" style="font-size: 13pt;">Work Order / Purchase Order (WO/PO) - Standard Conditions &amp; Acceptance</div>
          <div class="t3-header-divider"></div>

          <!-- Conditions 8 to 12 -->
          <div class="t3-condition-p2">
            <strong>8. No assignment / subletting.</strong> Supplier shall not transfer this order or sublet substantial work without buyer's written consent.
          </div>
          <div class="t3-condition-p2">
            <strong>9. Cancellation.</strong> Buyer may cancel for supplier's breach, insolvency, or misrepresentation (including invalid GST registration) without liability beyond payment for conforming goods already accepted.
          </div>
          <div class="t3-condition-p2">
            <strong>10. Force majeure.</strong> Neither party is liable for delay caused by events genuinely beyond its control, provided notice is given within 7 days; the affected timeline extends accordingly.
          </div>
          <div class="t3-condition-p2">
            <strong>11. Disputes &amp; jurisdiction.</strong> Parties will first attempt amicable settlement. Subject thereto, courts at \${jurisdictionLocation} (buyer's location) have exclusive jurisdiction.
          </div>
          <div class="t3-condition-p2">
            <strong>12. Entire agreement &amp; precedence.</strong> This PO with its annexures is the entire agreement and supersedes prior discussions. If a Special Condition (Part B) conflicts with a Standard Condition, the Special Condition prevails.
          </div>

          <!-- Part B Section Heading -->
          <div class="t3-section-heading" style="margin-top: 10pt;">Part B - Special Conditions (fill only if needed for this order)</div>

          <!-- Part B Table -->
          <table class="t3-partb-table">
            <thead>
              <tr>
                <th style="width: 28pt; text-align: center;">S.No</th>
                <th style="width: 347pt; text-align: left;">Special condition for this order</th>
                <th style="width: 140pt; text-align: center;">Overrides Standard Condition No. (if any)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align: center;">1</td>
                <td style="text-align: left;">\${specialRow1Desc}</td>
                <td style="text-align: center;">\${specialRow1Override}</td>
              </tr>
              <tr>
                <td style="text-align: center;">2</td>
                <td style="text-align: left;">\${specialRow2Desc}</td>
                <td style="text-align: center;">\${specialRow2Override}</td>
              </tr>
              <tr>
                <td style="text-align: center;">3</td>
                <td style="text-align: left;">&nbsp;</td>
                <td style="text-align: center;">&nbsp;</td>
              </tr>
            </tbody>
          </table>

          <!-- Part B Footnote -->
          <div class="t3-partb-footnote">
            If no Special Conditions are written above, only Part A applies. Typical uses: stage-wise delivery schedule, price variation formula for long orders, buyer-supplied material, inspection by buyer before dispatch, packing/marking instructions for export, tooling ownership.
          </div>

          <!-- Signatures Section -->
          <div class="t3-signatures-row">
            <div class="t3-sig-card">
              <div class="t3-sig-title">For Buyer - Authorised Signatory &amp; Seal</div>
              <div class="t3-sig-party">\${b.name || 'Apex Green Metals Pvt Ltd'}</div>
              <div class="t3-sig-divider"></div>
              <div class="t3-sig-bottom">
                <span>Authorised Signatory &amp; Seal</span>
                <span>Date: \${po.po_date || po.date_display || '____________'}</span>
              </div>
            </div>
            <div class="t3-sig-card">
              <div class="t3-sig-title">Accepted - For Supplier (Signatory, Seal &amp; Date)</div>
              <div class="t3-sig-party">\${v.name || 'Vendor'}</div>
              <div class="t3-sig-divider"></div>
              <div class="t3-sig-bottom">
                <span>Authorised Signatory &amp; Stamp</span>
                <span>Date: ____________</span>
              </div>
            </div>
          </div>

          <!-- Purechain Note (T-3) -->
          <div class="t3-purechain-note">
            <div class="t3-note-title">Purechain note (T-3)</div>
            <div class="t3-note-body">
              Condition 7 is Purechain's quiet superpower: it contractually secures the CBAM/EUDR/DPP data rights from suppliers that HARIYALI, KHOJAK and PASSPORT will later need - before the EU buyer ever asks. LEKHAK generates this PO from the accepted bid in T-2; supplier acceptance on WhatsApp is captured and stored as the acceptance record.
            </div>
          </div>
        </div>

      </div>
    \`;
  },

  `;

const updatedContent = content.slice(0, startIdx) + newFunction + content.slice(endIdx);
fs.writeFileSync(filePath, updatedContent, 'utf8');
console.log('Successfully applied new generatePoDocumentHtml!');


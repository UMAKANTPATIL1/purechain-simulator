const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    return new Promise((resolve, reject) => {
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) {
            reject(new Error(msg.error.message || JSON.stringify(msg.error)));
          } else {
            resolve(msg.result);
          }
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const wrapped = expression.trim().startsWith('(()') || expression.trim().startsWith('Array.') 
      ? expression 
      : `(() => {\n${expression}\n})()`;
    const result = await this.send('Runtime.evaluate', {
      expression: wrapped,
      returnByValue: true,
      awaitPromise: true
    });
    if (result.exceptionDetails) {
      throw new Error(JSON.stringify(result.exceptionDetails));
    }
    return result.result ? result.result.value : undefined;
  }
}

async function run() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const htmlFile = path.resolve(__dirname, '../index.html').replace(/\\/g, '/');
  const fileUrl = `file:///${htmlFile}`;
  const userDataDir = path.resolve(__dirname, 'cdp_test_profile');

  console.log(`Starting Chrome with URL: ${fileUrl}`);
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${userDataDir}`,
    fileUrl
  ], { stdio: 'ignore' });

  try {
    let targets = null;
    for (let i = 0; i < 30; i++) {
      await sleep(500);
      try {
        targets = await fetchJson('http://127.0.0.1:9222/json');
        if (targets && targets.length > 0) break;
      } catch (e) {}
    }

    if (!targets || targets.length === 0) {
      throw new Error('Failed to find Chrome debugging target');
    }

    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    console.log(`Connected to page target: ${pageTarget.title} (${pageTarget.url})`);

    const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await client.connect();
    await client.send('Page.enable');
    await client.send('Runtime.enable');

    await sleep(1000);

    // 1. Confirm which JavaScript files are actually loaded by the browser, including cache busters
    console.log('\n--- 1. LOADED SCRIPT FILES IN LIVE BROWSER ---');
    const scripts = await client.evaluate(`
      Array.from(document.querySelectorAll('script[src]')).map(s => ({
        src: s.getAttribute('src'),
        resolved: s.src
      }))
    `);
    scripts.forEach(s => console.log(`Script src: ${s.src}`));

    // 2. Buyer Flow: Switch to Buyer & Dispatch RFQ
    console.log('\n--- 2. BUYER FLOW: START & DISPATCH RFQ ---');
    await client.evaluate(`
      window.app.switchWorkflow('PROCUREMENT_BUYER');
      window.procurementEngine.syncRfqStore();
      window.PROCUREMENT_DATA.dispatchRFQ();
    `);
    const rfqInfo = await client.evaluate(`
      const rfq = window.PROCUREMENT_DATA.shared_store.current_rfq;
      return {
        rfq_ref: rfq.rfq_ref,
        material: rfq.material,
        quantity: rfq.quantity,
        unit: rfq.unit,
        status: rfq.status
      };
    `);
    console.log('Dispatched RFQ in browser:', JSON.stringify(rfqInfo, null, 2));

    // 3. Switch to Supplier Test (supplier_3)
    console.log('\n--- 3. SUPPLIER TEST: INITIAL SUBMISSION (REV 0) ---');
    await client.evaluate(`
      window.app.switchWorkflow('PROCUREMENT_SUPPLIER_3');
    `);
    await sleep(300);

    // Start quotation
    console.log('Supplier start quote...');
    let res = await client.evaluate(`return window.procurementEngine.handleSupplierAction('supplier_3', 'btn_supp_start_quote');`);
    console.log('start_quote step:', res ? res.step : 'null');
    // Field 1: Rate Rs 28,000 per MT
    res = await client.evaluate(`return window.procurementEngine.handleSupplierAction('supplier_3', 'btn_q_rate_opt2');`);
    console.log('rate_opt2 step:', res ? res.step : 'null');
    // Field 2: GST 18% (btn_q_gst_opt1)
    res = await client.evaluate(`return window.procurementEngine.handleSupplierAction('supplier_3', 'btn_q_gst_opt1');`);
    console.log('gst_opt1 step:', res ? res.step : 'null');
    // Field 3: Freight Rs 1,500 per MT (Option 2 => Rs 75,000)
    res = await client.evaluate(`return window.procurementEngine.handleSupplierAction('supplier_3', 'btn_q_freight_opt2');`);
    console.log('freight_opt2 step:', res ? res.step : 'null');
    // Field 4: Delivery period 2 days
    res = await client.evaluate(`return window.procurementEngine.handleSupplierAction('supplier_3', 'btn_q_deliv_opt1');`);
    console.log('deliv_opt1 step:', res ? res.step : 'null');
    // Field 5: Payment terms 50/50
    res = await client.evaluate(`return window.procurementEngine.handleSupplierAction('supplier_3', 'btn_q_pay_opt1');`);
    console.log('pay_opt1 step:', res ? res.step : 'null');
    // Field 6: Validity 3 days
    res = await client.evaluate(`return window.procurementEngine.handleSupplierAction('supplier_3', 'btn_q_valid_opt1');`);
    console.log('valid_opt1 step:', res ? res.step : 'null');
    // Field 7: Quality docs TC
    res = await client.evaluate(`return window.procurementEngine.handleSupplierAction('supplier_3', 'btn_q_docs_opt1');`);
    console.log('docs_opt1 step:', res ? res.step : 'null');
    // Confirm and submit initial quotation (Rev 0)
    res = await client.evaluate(`return window.procurementEngine.handleSupplierAction('supplier_3', 'btn_supp_confirm_submit');`);
    console.log('confirm_submit step:', res ? res.step : 'null');

    const rev0State = await client.evaluate(`
      const q = window.PROCUREMENT_DATA.shared_store.supplier_assignments['supplier_3'].quotation;
      return {
        quotation_ref: q.quotation_ref,
        revision: q.revision,
        unit_rate_val: q.unit_rate_val,
        unit_rate_unit: q.unit_rate_unit,
        gst_rate: q.gst_rate,
        gst_amount: q.gst_amount,
        freight_amount: q.freight_amount,
        freight_type: q.freight_type,
        freight_display: q.freight_display,
        freight_amount_per_mt: q.freight_amount_per_mt,
        base_amount: q.base_amount,
        total_landed_amount: q.total_landed_amount
      };
    `);
    console.log('Rev 0 Quotation in Browser State:\n', JSON.stringify(rev0State, null, 2));

    // 4. Execute Revision Flow through actual browser UI actions
    console.log('\n--- 4. EXECUTE REVISION WORKFLOW THROUGH BROWSER UI ---');
    // Step 4a: Click "Revise Quotation"
    console.log('User clicks: ✏️ Revise Quotation (btn_supp_revise_quote)...');
    const revisePrompt = await client.evaluate(`
      return window.procurementEngine.handleSupplierAction('supplier_3', 'btn_supp_revise_quote');
    `);
    console.log('Revise prompt displayed with step:', revisePrompt.step);

    // Step 4b: Click "Edit quotation"
    console.log('User clicks: ✏️ Edit quotation (btn_supp_edit_quote)...');
    const editMenu = await client.evaluate(`
      return window.procurementEngine.handleSupplierAction('supplier_3', 'btn_supp_edit_quote');
    `);
    console.log('Edit menu displayed with buttons:', editMenu.buttons.map(b => b.text).join(' | '));

    // Step 4c: Click Field 3 (Freight Charges)
    console.log('User clicks: 3️⃣ Freight Charges (btn_edit_q3)...');
    const freightPrompt = await client.evaluate(`
      return window.procurementEngine.handleSupplierAction('supplier_3', 'btn_edit_q3');
    `);
    console.log('Freight options displayed:', freightPrompt.buttons.map(b => b.text).join(' | '));

    // Step 4d: Select Option 1 (Freight charges Rs 1,000)
    console.log('User selects: Freight charges ₹1,000 (btn_q_freight_opt1)...');
    const afterFreight = await client.evaluate(`
      return window.procurementEngine.handleSupplierAction('supplier_3', 'btn_q_freight_opt1');
    `);
    console.log('Summary returned after freight selection. Total landed:', afterFreight.text.match(/Total Landed Amount:.*₹([0-9,]+)/)[0]);

    // Step 4e: Confirm and Submit Revised Quotation
    console.log('User clicks: ✅ Yes, Submit (btn_supp_confirm_submit)...');
    const submitResult = await client.evaluate(`
      return window.procurementEngine.handleSupplierAction('supplier_3', 'btn_supp_confirm_submit');
    `);
    console.log('Submission confirmed message snippet:\n', submitResult.text.split('\n').slice(0, 7).join('\n'));

    // 5. Inspect Stored Quotation Record After Revision
    console.log('\n--- 5. INSPECT STORED QUOTATION RECORD AFTER REVISION ---');
    const rev1State = await client.evaluate(`
      const q = window.PROCUREMENT_DATA.shared_store.supplier_assignments['supplier_3'].quotation;
      return {
        quotation_ref: q.quotation_ref,
        revision: q.revision,
        unit_rate_val: q.unit_rate_val,
        unit_rate_unit: q.unit_rate_unit,
        gst_rate: q.gst_rate,
        gst_amount: q.gst_amount,
        freight_amount: q.freight_amount,
        freight_type: q.freight_type,
        freight_display: q.freight_display,
        freight_amount_per_mt: q.freight_amount_per_mt,
        base_amount: q.base_amount,
        total_landed_amount: q.total_landed_amount
      };
    `);
    console.log('Rev 1 Quotation in Browser State:\n', JSON.stringify(rev1State, null, 2));

    // Also submit Supplier 2 (Ujjivan) so comparison matches user's report
    await client.evaluate(`
      window.procurementEngine.handleSupplierAction('supplier_2', 'btn_supp_start_quote');
      window.procurementEngine.handleSupplierAction('supplier_2', 'btn_q_rate_opt1'); // Rs 60/kg
      window.procurementEngine.handleSupplierAction('supplier_2', 'btn_q_gst_opt1'); // 12%
      window.procurementEngine.handleSupplierAction('supplier_2', 'btn_q_freight_opt1'); // Rs 1,000
      window.procurementEngine.handleSupplierAction('supplier_2', 'btn_q_deliv_opt1');
      window.procurementEngine.handleSupplierAction('supplier_2', 'btn_q_pay_opt3');
      window.procurementEngine.handleSupplierAction('supplier_2', 'btn_q_valid_opt1');
      window.procurementEngine.handleSupplierAction('supplier_2', 'btn_q_docs_opt3');
      window.procurementEngine.handleSupplierAction('supplier_2', 'btn_supp_confirm_submit');
    `);

    // 6. Switch to Buyer and Generate T-2 Comparison Report
    console.log('\n--- 6. SWITCH TO BUYER & GENERATE T-2 COMPARISON ---');
    await client.evaluate(`
      window.app.switchWorkflow('PROCUREMENT_BUYER');
    `);
    await sleep(300);

    await client.evaluate(`
      window.procurementEngine.handleBuyerAction('btn_buyer_generate_comparison');
    `);

    const comparisonData = await client.evaluate(`
      const rep = window.PROCUREMENT_DATA.shared_store.current_comparison;
      const s3 = rep.columns.find(c => c.supplier_id === 'supplier_3');
      return {
        comparison_ref: rep.comparison_ref,
        supplier_name: s3.supplier_name,
        quoted_rate_display: s3.quoted_rate_display,
        gst_display: s3.gst_display,
        freight_display: s3.freight_display,
        freight_amount: s3.freight_amount,
        total_landed_amount: s3.total_landed_amount,
        total_landed_display: s3.total_landed_display,
        landed_cost_per_kg: s3.landed_cost_per_kg,
        landed_cost_per_kg_display: s3.landed_cost_per_kg_display
      };
    `);
    console.log('Comparative Statement Record for Supplier Test:\n', JSON.stringify(comparisonData, null, 2));

    // 7. Render Document Preview Modal & Print to PDF
    console.log('\n--- 7. RENDER T-2 REPORT IN DOCUMENT MODAL & PRINT TO PDF VIA CDP ---');
    await client.evaluate(`
      const report = window.PROCUREMENT_DATA.shared_store.current_comparison;
      window.documentModal.showReportPreview('COMPARISON_DOCUMENT', report);
    `);
    await sleep(1000);

    const pdfData = await client.send('Page.printToPDF', {
      printBackground: true,
      paperWidth: 8.27, // A4
      paperHeight: 11.69,
      marginTop: 0.3,
      marginBottom: 0.3,
      marginLeft: 0.3,
      marginRight: 0.3
    });

    const pdfBuffer = Buffer.from(pdfData.data, 'base64');
    const pdfPath = path.resolve(__dirname, 'cdp_browser_t2_verified.pdf');
    fs.writeFileSync(pdfPath, pdfBuffer);
    console.log(`Saved live browser generated PDF to: ${pdfPath} (${pdfBuffer.length} bytes)`);

  } finally {
    chromeProc.kill();
  }
}

run().catch(err => {
  console.error('Runner error:', err);
  process.exit(1);
});

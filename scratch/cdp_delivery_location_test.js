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
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval exception: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result.value;
  }

  async screenshot(outputPath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(res.data, 'base64');
    fs.writeFileSync(outputPath, buf);
    console.log(`Saved screenshot: ${outputPath} (${buf.length} bytes)`);
    return outputPath;
  }
}

async function run() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9333;
  const artifactDir = 'C:\\Users\\spait\\.gemini\\antigravity\\brain\\406dc091-4ddc-4d40-abe7-65b455d9917c';
  
  const indexPath = path.resolve(__dirname, '../index.html').replace(/\\/g, '/');
  const fileUrl = `file:///${indexPath}`;

  console.log(`Launching Chrome pointing to: ${fileUrl}`);
  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,900',
    fileUrl
  ]);

  try {
    let targets = null;
    for (let i = 0; i < 30; i++) {
      await sleep(300);
      try {
        targets = await fetchJson(`http://127.0.0.1:${port}/json`);
        if (targets && targets.length > 0) break;
      } catch (e) {}
    }

    if (!targets || targets.length === 0) {
      throw new Error('Chrome remote debugging did not respond');
    }

    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('DOM.enable');

    await sleep(1500);

    // 1. Verify files and script version in live browser
    const scripts = await client.evaluate(`
      Array.from(document.querySelectorAll('script[src]')).map(s => s.getAttribute('src'))
    `);
    console.log('Scripts loaded in browser:', scripts.filter(s => s.includes('procurement') || s.includes('daam_guru')));

    // 2. Switch to Buyer Workflow
    await client.evaluate(`
      window.app.switchWorkflow('PROCUREMENT_BUYER');
    `);
    await sleep(300);

    // Start RFQ creation
    await client.evaluate(`
      window.procurementEngine.handleBuyerAction('btn_buyer_start_rfq');
      window.procurementEngine.handleBuyerAction('btn_buyer_select_onion');
      window.procurementEngine.handleBuyerAction('btn_buyer_qty_50');
      window.procurementEngine.handleBuyerAction('btn_buyer_specs_default');
      window.procurementEngine.handleBuyerAction('btn_buyer_dead_14d');
      window.procurementEngine.handleBuyerAction('btn_t1_opt2'); // FOR destination
    `);
    await sleep(300);

    // Now we should be on Term 2
    const term2Step = await client.evaluate(`
      window.procurementEngine.buyer_state.step
    `);
    console.log('Current step at Term 2 prompt:', term2Step);

    // Capture screenshot of Term 2 initial WhatsApp prompt with 6 options
    await client.screenshot(path.join(artifactDir, 'term2_initial_options_prompt.png'));

    // Test rejection of bare city name
    console.log('\n--- Testing rejection of bare city "Pune" ---');
    const rejectCityRes = await client.evaluate(`
      (() => {
        window.procurementEngine.handleBuyerAction('btn_t2_city_pune');
        return window.procurementEngine.handleBuyerAction(null, 'Pune');
      })()
    `);
    console.log('Bare city rejection text:\n', rejectCityRes.text);

    // Test rejection of invalid PIN
    console.log('\n--- Testing rejection of invalid PIN "Plot 15 Chakan 41050" ---');
    const rejectPinRes = await client.evaluate(`
      (() => {
        return window.procurementEngine.handleBuyerAction(null, 'Plot 15 Chakan 41050');
      })()
    `);
    console.log('Invalid PIN rejection text:\n', rejectPinRes.text);

    // Enter complete valid address
    console.log('\n--- Submitting complete valid address for Pune ---');
    const validRes = await client.evaluate(`
      (() => {
        return window.procurementEngine.handleBuyerAction(null, 'Plot 15, Chakan Industrial Area Phase 2, Pune, Maharashtra - 410501');
      })()
    `);
    console.log('Response after valid submission (advances to):', validRes.step);

    const savedDest = await client.evaluate(`
      (() => {
        return {
          delivery_location: window.procurementEngine.buyer_state.delivery_location,
          term_2: window.procurementEngine.buyer_state.terms.term_2,
          details: window.procurementEngine.buyer_state.delivery_location_details,
          registered_office: window.PROCUREMENT_DATA.buyer.registered_office_address
        };
      })()
    `);
    console.log('Saved Destination Record:\n', JSON.stringify(savedDest, null, 2));

    // Complete remaining terms to reach review
    await client.evaluate(`
      window.procurementEngine.handleBuyerAction('btn_t3_opt2'); // 100% after receipt & acceptance
      window.procurementEngine.handleBuyerAction('btn_t4_opt1'); // Active GSTIN
      window.procurementEngine.handleBuyerAction('btn_t5_opt1'); // CoA + Agmark
      window.procurementEngine.handleBuyerAction('btn_t6_opt1'); // Indian Origin
      window.procurementEngine.handleBuyerAction('btn_t7_opt1'); // PureChain WhatsApp
      window.procurementEngine.handleBuyerAction('btn_t8_opt1'); // Buyer right
    `);
    await sleep(300);

    const reviewStep = await client.evaluate(`window.procurementEngine.buyer_state.step`);
    console.log('Current step after terms:', reviewStep);

    // Capture screenshot of Buyer RFQ Review with confirmed destination
    await client.screenshot(path.join(artifactDir, 'buyer_rfq_review_with_delivery_location.png'));

    // Open T-1 RFQ Document Modal & Print to PDF
    console.log('\n--- Generating T-1 RFQ Document PDF ---');
    await client.evaluate(`
      const rfq = window.procurementEngine.syncRfqStore();
      window.documentModal.showReportPreview('RFQ_DOCUMENT', rfq);
    `);
    await sleep(1000);
    await client.screenshot(path.join(artifactDir, 'generated_t3_po_modal.png'));
    await client.screenshot(path.join(artifactDir, 'generated_t1_rfq_modal.png'));

    const rfqPdfData = await client.send('Page.printToPDF', {
      printBackground: true,
      paperWidth: 8.27,
      paperHeight: 11.69,
      marginTop: 0.3,
      marginBottom: 0.3,
      marginLeft: 0.3,
      marginRight: 0.3
    });
    const rfqPdfBuffer = Buffer.from(rfqPdfData.data, 'base64');
    const rfqPdfPath = path.join(artifactDir, 'generated_t1_rfq_delivery_location_verified.pdf');
    fs.writeFileSync(rfqPdfPath, rfqPdfBuffer);
    console.log(`Saved T-1 RFQ PDF: ${rfqPdfPath} (${rfqPdfBuffer.length} bytes)`);

    // Dispatch RFQ
    console.log('\n--- Dispatching RFQ and checking Supplier WhatsApp message ---');
    await client.evaluate(`
      window.documentModal.close();
      window.procurementEngine.executeRfqDispatch();
    `);
    await sleep(300);

    const supp1Msg = await client.evaluate(`
      (() => {
        const hist = window.PROCUREMENT_DATA.shared_store.conversation_histories['supplier_1'] || [];
        return hist[hist.length - 1];
      })()
    `);
    console.log('Supplier 1 Incoming RFQ snippet:\n', supp1Msg ? supp1Msg.text.slice(0, 400) + '...' : 'None');

    // Switch to Supplier 1, complete quotation, then generate T-3 PO
    console.log('\n--- Generating Purchase Order (Template T-3) ---');
    await client.evaluate(`
      (() => {
        let po = window.PROCUREMENT_DATA.createPurchaseOrder({
          supplier_id: 'supplier_1',
          quantity: 50.0,
          unit: 'MT',
          unit_rate_val: 28000,
          gst_rate: 5,
          freight_amount: 1000,
          delivery_address: window.procurementEngine.buyer_state.delivery_location
        });
        po = window.PROCUREMENT_DATA.recordBuyerPoSignOff(po.po_ref, 'Procurement Desk');
        po = window.PROCUREMENT_DATA.acknowledgePurchaseOrder(po.po_ref, 'supplier_1');
        window.documentModal.showReportPreview('PO_DOCUMENT', po);
      })()
    `);
    await sleep(1000);
    await client.screenshot(path.join(artifactDir, 'generated_t3_po_modal.png'));

    const poPdfData = await client.send('Page.printToPDF', {
      printBackground: true,
      paperWidth: 8.27,
      paperHeight: 11.69,
      marginTop: 0.3,
      marginBottom: 0.3,
      marginLeft: 0.3,
      marginRight: 0.3
    });
    const poPdfBuffer = Buffer.from(poPdfData.data, 'base64');
    const poPdfPath = path.join(artifactDir, 'generated_t3_po_delivery_location_verified.pdf');
    fs.writeFileSync(poPdfPath, poPdfBuffer);
    console.log(`Saved T-3 PO PDF: ${poPdfPath} (${poPdfBuffer.length} bytes)`);

    console.log('\nAll browser operations completed successfully!');
  } finally {
    chromeProc.kill();
  }
}

run().catch(err => {
  console.error('Runner error:', err);
  process.exit(1);
});

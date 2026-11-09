const fs = require('fs');
const text = fs.readFileSync('purechain-simulator/js/engines/procurement_engine.js', 'utf8');
const lines = text.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('freight') || l.includes('Freight') || l.includes('btn_q_freight') || l.includes('1500') || l.includes('1,500')) {
    console.log(`${idx+1}: ${l.trim()}`);
  }
});


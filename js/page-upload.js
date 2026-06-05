// ═══════════════════════════════════════════
//  DATA ENTRY PAGE — Manual + CSV Upload
//  Manual is the primary path. CSV upload is secondary.
// ═══════════════════════════════════════════

let entryState = {
  mode: 'sales',
  csvType: 'sales',
  csvParsed: null,
  invSearch: '',
  imgSearch: '',
  imgFilter: 'all',
};

registerPage('upload', () => {
  document.getElementById('page-upload').innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-eyebrow">Data Entry</div>
        <div class="page-title">Add Sales · Inventory · Images</div>
        <div class="page-desc">Enter data manually one row at a time, or upload a CSV. Everything you save here persists across sessions.</div>
      </div>
    </div>

    <div class="tabs" style="margin-bottom: 20px;">
      <div class="tab ${entryState.mode==='sales'?'active':''}" onclick="entrySetMode('sales')">📊 Manual Sales</div>
      <div class="tab ${entryState.mode==='inventory'?'active':''}" onclick="entrySetMode('inventory')">📦 Manual Inventory</div>
      <div class="tab ${entryState.mode==='images'?'active':''}" onclick="entrySetMode('images')">🖼 Product Images</div>
      <div class="tab ${entryState.mode==='csv'?'active':''}" onclick="entrySetMode('csv')">📁 CSV Upload</div>
    </div>

    <div id="entry-mode-content"></div>
  `;
  renderEntryMode();
});

function entrySetMode(m) { entryState.mode = m; showPage('upload'); }

function renderEntryMode() {
  const wrap = document.getElementById('entry-mode-content');
  if (!wrap) return;
  if (entryState.mode === 'sales') wrap.innerHTML = renderSalesEntry();
  else if (entryState.mode === 'inventory') wrap.innerHTML = renderInventoryEntry();
  else if (entryState.mode === 'images') wrap.innerHTML = renderImageEntry();
  else if (entryState.mode === 'csv') wrap.innerHTML = renderCsvUpload();
}

// ════════════════════════════════════════════════════
// MANUAL SALES ENTRY
// ════════════════════════════════════════════════════
function renderSalesEntry() {
  return `
    <div class="card" style="padding: 20px; margin-bottom: 20px;">
      <div style="font-family: var(--font-display); font-size: 16px; font-weight: 600; margin-bottom: 4px;">Add a Sales Entry</div>
      <div style="font-size: 12.5px; color: var(--muted); margin-bottom: 18px;">One row = one product × platform × month. Enter units sold and revenue.</div>

      <div class="form-row">
        <div>
          <label style="display:block;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px;">Product *</label>
          <select id="sale-pid" class="select" style="width:100%;">
            <option value="">— Select Product —</option>
            ${PRODUCTS.map(p => `<option value="${p.id}">${shortName(p.name, 50)} ${p.sku_code ? '· ' + p.sku_code : ''}</option>`).join('')}
          </select>
        </div>
        <div>
          <label style="display:block;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px;">Platform *</label>
          <select id="sale-plat" class="select" style="width:100%;">
            <option value="">— Select Platform —</option>
            ${PLATFORMS.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="form-row three">
        <div>
          <label style="display:block;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px;">Month *</label>
          <select id="sale-month" class="select" style="width:100%;">
            <option value="0">Current month</option>
            <option value="1">1 month ago</option>
            <option value="2">2 months ago</option>
            <option value="3">3 months ago</option>
            <option value="4">4 months ago</option>
            <option value="5">5 months ago</option>
            <option value="6">6 months ago</option>
            <option value="11">11 months ago</option>
          </select>
        </div>
        <div>
          <label style="display:block;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px;">Units Sold *</label>
          <input id="sale-units" type="number" min="0" step="1" class="select" style="width:100%;" placeholder="e.g. 142">
        </div>
        <div>
          <label style="display:block;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px;">Revenue (₹) *</label>
          <input id="sale-revenue" type="number" min="0" step="1" class="select" style="width:100%;" placeholder="e.g. 124850">
        </div>
      </div>

      <div style="display:flex;gap:10px;margin-top:6px;">
        <button class="btn accent" onclick="commitSaleEntry()">+ Add Sale Entry</button>
        <button class="btn ghost" onclick="autofillRevenue()">⚡ Auto-fill revenue from ASP</button>
      </div>
    </div>

    ${renderRecentSales()}
  `;
}

function renderRecentSales() {
  const total = SALES_DATA.length;
  if (!total) {
    return `
      <div class="card" style="padding: 32px 20px; text-align: center; color: var(--muted);">
        <div style="font-family: var(--font-display); font-size: 16px; font-weight: 600; color: var(--ink); margin-bottom: 4px;">No sales entries yet</div>
        <div style="font-size: 13px;">Add your first sale above. Once you do, all dashboards populate with real numbers.</div>
      </div>
    `;
  }
  const recent = [...SALES_DATA].sort((a,b) => (b._added || 0) - (a._added || 0)).slice(0, 50);
  return `
    <div class="sec-title">
      <span>Saved Sales Entries</span>
      <span class="sec-title-line"></span>
      <span class="right">${total} total · showing ${recent.length} most recent</span>
    </div>
    <div class="card" style="padding: 0; overflow: hidden;">
      <table class="data-table" style="width:100%;">
        <thead>
          <tr>
            <th>Product</th>
            <th>Platform</th>
            <th>Month</th>
            <th style="text-align:right;">Units</th>
            <th style="text-align:right;">Revenue</th>
            <th style="text-align:right;">Action</th>
          </tr>
        </thead>
        <tbody>
          ${recent.map((s) => {
            const p = PRODUCTS.find(x => x.id === s.pid);
            const plat = getPlatform(s.plat);
            const realIdx = SALES_DATA.indexOf(s);
            return `
              <tr>
                <td>${p ? shortName(p.name, 40) : '#' + s.pid}</td>
                <td><span class="tag" style="background:${plat?.bg};color:${plat?.color};">${plat?.short || s.plat}</span></td>
                <td>${s.month === 0 ? 'Current' : s.month + 'mo ago'}</td>
                <td style="text-align:right;font-family:var(--font-mono);">${s.units}</td>
                <td style="text-align:right;font-family:var(--font-mono);">${inr(s.revenue)}</td>
                <td style="text-align:right;"><button class="btn tiny ghost" onclick="deleteSaleEntry(${realIdx})">×</button></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
    <div style="margin-top: 16px;">
      <button class="btn secondary sm" onclick="if(confirm('Delete ALL sales entries? This cannot be undone.')) clearAllSales()">⚠ Clear all sales data</button>
    </div>
  `;
}

function autofillRevenue() {
  const pid = parseInt(document.getElementById('sale-pid').value);
  const units = parseInt(document.getElementById('sale-units').value);
  if (!pid || !units) { showToast('Pick a product and enter units first', false); return; }
  const p = PRODUCTS.find(x => x.id === pid);
  if (!p || !p.asp) { showToast('This product has no ASP set — fill revenue manually', false); return; }
  document.getElementById('sale-revenue').value = Math.round(p.asp * units);
  showToast(`Auto-filled: ${units} × ${inr(p.asp)} = ${inr(p.asp * units)}`);
}

async function commitSaleEntry() {
  const pid = parseInt(document.getElementById('sale-pid').value);
  const plat = document.getElementById('sale-plat').value;
  const month = parseInt(document.getElementById('sale-month').value);
  const units = parseInt(document.getElementById('sale-units').value);
  const revenue = parseInt(document.getElementById('sale-revenue').value);
  if (!pid || !plat || isNaN(month) || isNaN(units) || isNaN(revenue)) {
    showToast('Fill all fields before saving', false); return;
  }
  const existingIdx = SALES_DATA.findIndex(s => s.pid === pid && s.plat === plat && s.month === month);
  if (existingIdx > -1) {
    if (!confirm(`A row already exists (${SALES_DATA[existingIdx].units} units, ${inr(SALES_DATA[existingIdx].revenue)}). Replace it?`)) return;
    SALES_DATA[existingIdx] = { pid, plat, month, units, revenue, _added: Date.now() };
  } else {
    SALES_DATA.push({ pid, plat, month, units, revenue, _added: Date.now() });
  }
  await persistSales();
  updateNavStats();
  updateSidebarCounts();
  document.getElementById('sale-units').value = '';
  document.getElementById('sale-revenue').value = '';
  showToast('Sale entry saved · ' + SALES_DATA.length + ' total rows');
  renderEntryMode();
}

async function deleteSaleEntry(idx) {
  SALES_DATA.splice(idx, 1);
  await persistSales();
  updateNavStats(); updateSidebarCounts();
  renderEntryMode();
}

async function clearAllSales() {
  SALES_DATA = [];
  await persistSales();
  updateNavStats(); updateSidebarCounts();
  showToast('All sales data cleared');
  renderEntryMode();
}

// ════════════════════════════════════════════════════
// MANUAL INVENTORY ENTRY
// ════════════════════════════════════════════════════
function renderInventoryEntry() {
  const search = entryState.invSearch || '';
  const filtered = PRODUCTS.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku_code || '').toLowerCase().includes(search.toLowerCase())
  );

  return `
    <div class="card" style="padding: 16px 20px; margin-bottom: 16px; background: var(--surface-alt);">
      <div style="font-size: 12.5px; color: var(--ink-mid);">Update inventory split per product. Numbers represent units currently held in each location. Edits save automatically.</div>
    </div>

    <div class="filter-bar" style="margin-bottom: 14px;">
      <input class="select" placeholder="Search product or SKU..." value="${search}" oninput="entryState.invSearch = this.value; renderEntryMode()" style="flex:1;min-width:240px;">
      <span style="font-size: 12px; color: var(--muted); align-self: center;">${filtered.length} products · ${INVENTORY_DATA.length} have inventory recorded</span>
    </div>

    <div class="card" style="padding: 0; overflow: hidden;">
      <table class="data-table" style="width:100%;">
        <thead>
          <tr>
            <th style="width:36%;">Product</th>
            <th style="text-align:right;">FBA</th>
            <th style="text-align:right;">Blinkit</th>
            <th style="text-align:right;">Flipkart</th>
            <th style="text-align:right;">Warehouse</th>
            <th style="text-align:right;">In-Transit</th>
            <th style="text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.slice(0, 60).map(p => {
            const inv = INVENTORY_DATA.find(i => i.pid === p.id) || { amazon:0, blinkit:0, flipkart:0, warehouse:0, in_transit:0 };
            const total = inv.amazon + inv.blinkit + inv.flipkart + inv.warehouse + inv.in_transit;
            return `
              <tr>
                <td>
                  <div style="font-size:12.5px;">${shortName(p.name, 38)}</div>
                  <div style="font-size:10px;color:var(--muted);font-family:var(--font-mono);margin-top:2px;">${p.sku_code || '—'}</div>
                </td>
                ${['amazon','blinkit','flipkart','warehouse','in_transit'].map(f => `
                  <td style="text-align:right;"><input type="number" min="0" step="1" value="${inv[f] || ''}" onchange="updateInvCell(${p.id},'${f}',this.value)" style="width:72px;text-align:right;font-family:var(--font-mono);font-size:12px;padding:4px 6px;border:1px solid var(--rule);border-radius:3px;"></td>
                `).join('')}
                <td style="text-align:right;font-family:var(--font-mono);font-weight:600;font-size:12.5px;" id="inv-total-${p.id}">${total || '—'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
    ${filtered.length > 60 ? `<div style="text-align:center;padding:12px;color:var(--muted);font-size:12px;">${filtered.length - 60} more products — refine search to see them</div>` : ''}
  `;
}

async function updateInvCell(pid, field, value) {
  const v = parseInt(value) || 0;
  let inv = INVENTORY_DATA.find(i => i.pid === pid);
  if (!inv) {
    inv = { pid, amazon: 0, blinkit: 0, flipkart: 0, warehouse: 0, in_transit: 0 };
    INVENTORY_DATA.push(inv);
  }
  inv[field] = v;
  const total = inv.amazon + inv.blinkit + inv.flipkart + inv.warehouse + inv.in_transit;
  if (total === 0) {
    INVENTORY_DATA = INVENTORY_DATA.filter(i => i.pid !== pid);
  }
  const totalEl = document.getElementById('inv-total-' + pid);
  if (totalEl) totalEl.textContent = total || '—';
  await persistInventory();
  updateSidebarCounts();
}

// ════════════════════════════════════════════════════
// PRODUCT IMAGES
// ════════════════════════════════════════════════════
function renderImageEntry() {
  const search = entryState.imgSearch || '';
  const filter = entryState.imgFilter || 'all';
  let filtered = PRODUCTS.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));
  if (filter === 'with') filtered = filtered.filter(p => p.img);
  if (filter === 'without') filtered = filtered.filter(p => !p.img);
  const withCount = PRODUCTS.filter(p => p.img).length;

  return `
    <div class="card" style="padding: 16px 20px; margin-bottom: 16px; background: var(--gold-soft); border-color: var(--gold-line);">
      <div style="font-family: var(--font-display); font-size: 13px; font-weight: 600; color: var(--gold); letter-spacing: 0.04em; margin-bottom: 6px;">PRODUCT IMAGE — HOW TO</div>
      <div style="font-size: 12.5px; color: #5A4A1A; line-height: 1.6;">
        Paste a <strong>direct image URL</strong> (.jpg, .png, .webp) to render the photo on cards/drawers. <br>
        For Drive: open image in Drive → Share → "Anyone with link" → use format
        <code style="background:#fff;padding:2px 6px;border-radius:3px;font-family:var(--font-mono);font-size:11px;">https://drive.google.com/uc?export=view&id=FILE_ID</code>
      </div>
    </div>

    <div class="filter-bar" style="margin-bottom: 14px;">
      <input class="select" placeholder="Search product..." value="${search}" oninput="entryState.imgSearch = this.value; renderEntryMode()" style="flex:1;min-width:240px;">
      <select class="select" onchange="entryState.imgFilter = this.value; renderEntryMode()" style="min-width:160px;">
        <option value="all" ${filter==='all'?'selected':''}>All products (${PRODUCTS.length})</option>
        <option value="with" ${filter==='with'?'selected':''}>With image (${withCount})</option>
        <option value="without" ${filter==='without'?'selected':''}>Without image (${PRODUCTS.length - withCount})</option>
      </select>
    </div>

    <div class="card" style="padding: 0; overflow: hidden;">
      <table class="data-table" style="width:100%;">
        <thead>
          <tr>
            <th style="width:64px;">Preview</th>
            <th style="width:30%;">Product</th>
            <th>Image URL</th>
            <th style="width:80px;">Drive</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.slice(0, 80).map(p => `
            <tr>
              <td>
                <div style="width:48px;height:48px;border:1px solid var(--rule);border-radius:4px;overflow:hidden;background:#fafafa;display:flex;align-items:center;justify-content:center;">
                  ${p.img ? `<img src="${p.img}" style="width:100%;height:100%;object-fit:contain;" onerror="this.outerHTML='<span style=color:var(--accent);font-size:9px>broken</span>'">` : `<span style="font-size:9px;color:var(--muted);">none</span>`}
                </div>
              </td>
              <td>
                <div style="font-size:12.5px;">${shortName(p.name, 36)}</div>
                <div style="font-size:10px;color:var(--muted);font-family:var(--font-mono);">${p.sku_code || '—'}</div>
              </td>
              <td>
                <input type="url" value="${(p.img || '').replace(/"/g,'&quot;')}" onchange="updateProductImage(${p.id}, this.value)" placeholder="https://...image.jpg" style="width:100%;padding:5px 8px;border:1px solid var(--rule);border-radius:3px;font-family:var(--font-mono);font-size:11px;">
              </td>
              <td>${p.drive ? `<a href="${p.drive}" target="_blank" class="btn tiny secondary">Open ↗</a>` : '<span style="font-size:10px;color:var(--muted);">—</span>'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ${filtered.length > 80 ? `<div style="text-align:center;padding:12px;color:var(--muted);font-size:12px;">${filtered.length - 80} more — refine search</div>` : ''}
  `;
}

async function updateProductImage(pid, url) {
  const p = PRODUCTS.find(x => x.id === pid);
  if (!p) return;
  p.img = url.trim();
  await persistProductOverrides();
  showToast(p.img ? 'Image saved' : 'Image cleared');
  renderEntryMode();
}

// ════════════════════════════════════════════════════
// CSV UPLOAD
// ════════════════════════════════════════════════════
function renderCsvUpload() {
  return `
    <div class="card" style="padding: 16px 20px; margin-bottom: 16px;">
      <label style="display:block;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">CSV Type</label>
      <select class="select" onchange="entryState.csvType = this.value; entryState.csvParsed = null; renderEntryMode()" style="margin-bottom: 12px;min-width:240px;">
        <option value="sales" ${entryState.csvType==='sales'?'selected':''}>Sales Report</option>
        <option value="inventory" ${entryState.csvType==='inventory'?'selected':''}>Inventory Snapshot</option>
      </select>

      <div style="font-size: 12px; color: var(--muted); margin-bottom: 12px; padding: 12px; background: var(--surface-alt); border-radius: 4px; border: 1px solid var(--rule);">
        <strong style="color: var(--ink);">Expected columns:</strong><br>
        ${entryState.csvType === 'sales'
          ? '<code style="font-family:var(--font-mono);font-size:11px;">sku, platform, month, units, revenue</code> &nbsp; (month: 0=current, 1=last month, etc. · platform: amazon-in, amazon-com, flipkart, blinkit, zepto, instamart)'
          : '<code style="font-family:var(--font-mono);font-size:11px;">sku, amazon, blinkit, flipkart, warehouse, in_transit</code>'
        }
      </div>

      <div style="border: 2px dashed var(--rule); border-radius: 6px; padding: 28px; text-align: center;">
        <input type="file" id="csv-file-input" accept=".csv" onchange="handleCsvFile(event)" style="display:none;">
        <button class="btn accent" onclick="document.getElementById('csv-file-input').click()">📁 Choose CSV File</button>
        <div style="font-size: 11px; color: var(--muted); margin-top: 10px;">UTF-8, comma-separated, first row = headers</div>
      </div>
    </div>

    ${entryState.csvParsed ? renderCsvPreview() : ''}
  `;
}

function renderCsvPreview() {
  const { headers, rows, matched, unmatched } = entryState.csvParsed;
  return `
    <div class="card" style="padding: 16px 20px; margin-bottom: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div>
          <div style="font-family:var(--font-display);font-size:14px;font-weight:600;">Preview: ${rows.length} rows</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px;">
            <span style="color:var(--green);">✓ ${matched} matched</span> ·
            <span style="color:var(--accent);">✗ ${unmatched} unmatched SKUs</span>
          </div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn ghost sm" onclick="entryState.csvParsed = null; renderEntryMode()">Cancel</button>
          <button class="btn accent" onclick="commitCsvUpload()">✓ Commit ${matched} rows</button>
        </div>
      </div>
      <div style="max-height: 400px; overflow: auto; border: 1px solid var(--rule); border-radius: 4px;">
        <table class="data-table" style="width:100%;font-size:11px;">
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join('')}<th>Match</th></tr>
          </thead>
          <tbody>
            ${rows.slice(0, 100).map(r => `
              <tr style="${!r._matched ? 'background:rgba(255,59,0,0.05)' : ''}">
                ${headers.map(h => `<td>${(r[h] !== undefined ? r[h] : '—')}</td>`).join('')}
                <td>${r._matched ? '<span style="color:var(--green);">✓</span>' : '<span style="color:var(--accent);">✗</span>'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ${rows.length > 100 ? `<div style="text-align:center;color:var(--muted);font-size:11px;padding:8px;">+ ${rows.length - 100} more rows</div>` : ''}
    </div>
  `;
}

function handleCsvFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => parseAndPreviewCsv(ev.target.result);
  reader.readAsText(file);
}

function parseAndPreviewCsv(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) { showToast('CSV needs headers + at least one row', false); return; }
  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
  const rows = [];
  let matched = 0, unmatched = 0;
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => row[h] = (cells[idx] || '').trim());
    const sku = row.sku || row.sku_code || '';
    const product = PRODUCTS.find(p => (p.sku_code || '').toLowerCase() === sku.toLowerCase());
    row._matched = !!product;
    row._pid = product ? product.id : null;
    if (row._matched) matched++; else unmatched++;
    rows.push(row);
  }
  entryState.csvParsed = { headers, rows, matched, unmatched };
  renderEntryMode();
}

function parseCSVLine(line) {
  const cells = [];
  let cur = '', inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === ',' && !inQ) { cells.push(cur); cur = ''; continue; }
    cur += ch;
  }
  cells.push(cur);
  return cells;
}

async function commitCsvUpload() {
  const { rows } = entryState.csvParsed;
  let added = 0;
  for (const row of rows) {
    if (!row._matched) continue;
    if (entryState.csvType === 'sales') {
      const month = parseInt(row.month) || 0;
      const units = parseInt(row.units) || 0;
      const revenue = parseFloat(row.revenue) || 0;
      const plat = row.platform || row.plat || '';
      if (!plat) continue;
      const existingIdx = SALES_DATA.findIndex(s => s.pid === row._pid && s.plat === plat && s.month === month);
      const entry = { pid: row._pid, plat, month, units, revenue, _added: Date.now() };
      if (existingIdx > -1) SALES_DATA[existingIdx] = entry;
      else SALES_DATA.push(entry);
      added++;
    } else if (entryState.csvType === 'inventory') {
      const inv = {
        pid: row._pid,
        amazon: parseInt(row.amazon) || 0,
        blinkit: parseInt(row.blinkit) || 0,
        flipkart: parseInt(row.flipkart) || 0,
        warehouse: parseInt(row.warehouse) || 0,
        in_transit: parseInt(row.in_transit) || 0,
      };
      const existingIdx = INVENTORY_DATA.findIndex(i => i.pid === row._pid);
      if (existingIdx > -1) INVENTORY_DATA[existingIdx] = inv;
      else INVENTORY_DATA.push(inv);
      added++;
    }
  }
  if (entryState.csvType === 'sales') await persistSales();
  else await persistInventory();
  updateNavStats(); updateSidebarCounts();
  entryState.csvParsed = null;
  showToast(`✓ Committed ${added} rows`);
  renderEntryMode();
}

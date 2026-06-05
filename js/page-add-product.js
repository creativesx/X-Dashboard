// ═══════════════════════════════════════════
//  ADD / EDIT PRODUCT PAGE
// ═══════════════════════════════════════════

let editingProductId = null;

registerPage('add-product', (pid) => {
  editingProductId = pid;
  const p = pid ? PRODUCTS.find(x => x.id === pid) : null;
  const isEdit = !!p;

  document.getElementById('page-add-product').innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-eyebrow">${isEdit ? 'Edit Product' : 'New Product'}</div>
        <div class="page-title">${isEdit ? 'Edit: ' + shortName(p.name, 30) : 'Add Product'}</div>
        <div class="page-desc">${isEdit ? 'Update product details, pricing, or platform assignments.' : 'Register a new SKU with full details, specs, and platform assignments.'}</div>
      </div>
      <div class="page-actions">
        <button class="btn ghost" onclick="showPage('catalogue')">← Back to Catalogue</button>
      </div>
    </div>

    <!-- SMART IMPORT -->
    <div class="card dark" style="margin-bottom: 20px; max-width: 920px;">
      <div style="font-family:var(--font-mono);font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:0.18em;text-transform:uppercase;margin-bottom:12px;">⚡ Smart URL Import</div>
      <div style="display:flex;gap:8px;">
        <input class="input" id="import-url" placeholder="Paste Amazon, Flipkart, Blinkit, or Drive URL..." style="background:rgba(255,255,255,0.08);border-color:rgba(255,255,255,0.15);color:#fff;flex:1;">
        <button class="btn accent" onclick="smartImport()">Auto-detect →</button>
      </div>
      <div id="parse-result" style="margin-top:12px;font-size:12px;color:rgba(255,255,255,0.7);display:none;"></div>
    </div>

    <!-- DUPLICATE WARNING -->
    <div id="dupe-warn" style="display:none;margin-bottom:16px;max-width:920px;">
      <div class="hint-box gold">
        <div class="hint-icon" style="background:var(--gold);color:var(--gold-soft);">!</div>
        <div id="dupe-warn-content"></div>
      </div>
    </div>

    <!-- FORM -->
    <div class="card card-pad-lg" style="max-width: 920px;">

      <!-- BASIC INFO -->
      <div style="font-family:var(--font-mono);font-size:10px;color:var(--muted);letter-spacing:0.18em;text-transform:uppercase;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid var(--rule);">Basic Information</div>

      <div class="form-row full">
        <div class="field">
          <label class="field-label">Product Name *</label>
          <input class="input" id="f-name" value="${isEdit ? p.name : ''}" placeholder="e.g. 100W USB-C Braided Cable — Black" oninput="checkDuplicates(this.value)">
        </div>
      </div>
      <div class="form-row three">
        <div class="field">
          <label class="field-label">Category *</label>
          <select class="select" id="f-cat" onchange="autoFillHSN()">
            <option value="">Select...</option>
            ${CATEGORIES.map(c => `<option value="${c.id}" ${isEdit && p.cat === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label class="field-label">Sub-brand *</label>
          <select class="select" id="f-brand">
            <option value="">Select...</option>
            ${Object.entries(BRANDS).map(([k, b]) => `<option value="${k}" ${isEdit && p.brand === k ? 'selected' : ''}>${b.name}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label class="field-label">Source</label>
          <select class="select" id="f-source">
            <option value="FACTORY">Factory</option>
            <option value="THIRDPARTY">Third Party</option>
            <option value="OEM">OEM</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="field">
          <label class="field-label">SKU / Uniware Code</label>
          <input class="input" id="f-sku" value="${isEdit ? (p.sku_code || '') : ''}" placeholder="e.g. CBL-AL-C2C-100W-B">
          <span class="field-hint">Leave blank to auto-generate</span>
        </div>
        <div class="field">
          <label class="field-label">HSN Code</label>
          <input class="input" id="f-hsn" value="${isEdit ? (p.hsn || '') : ''}" placeholder="Auto-fills from category">
        </div>
      </div>
      <div class="form-row full">
        <div class="field">
          <label class="field-label">Description</label>
          <textarea class="textarea" id="f-desc" placeholder="Full product description for listings...">${isEdit ? (p.desc || '') : ''}</textarea>
        </div>
      </div>

      <!-- PRICING -->
      <div style="font-family:var(--font-mono);font-size:10px;color:var(--muted);letter-spacing:0.18em;text-transform:uppercase;margin:24px 0 14px;padding-bottom:10px;border-bottom:1px solid var(--rule);">Pricing</div>

      <div class="form-row four">
        <div class="field">
          <label class="field-label">COGS *</label>
          <input class="input" id="f-cogs" type="number" value="${isEdit ? p.cogs : ''}" placeholder="815" oninput="calcLiveMargin()">
        </div>
        <div class="field">
          <label class="field-label">MRP *</label>
          <input class="input" id="f-mrp" type="number" value="${isEdit ? p.mrp : ''}" placeholder="4999" oninput="calcLiveMargin()">
        </div>
        <div class="field">
          <label class="field-label">Suggested ASP</label>
          <input class="input" id="f-asp" type="number" value="${isEdit ? p.asp : ''}" placeholder="2499" oninput="calcLiveMargin()">
        </div>
        <div class="field">
          <label class="field-label">GST %</label>
          <select class="select" id="f-gst">
            <option value="0.05" ${isEdit && p.gst === 0.05 ? 'selected' : ''}>5%</option>
            <option value="0.12" ${isEdit && p.gst === 0.12 ? 'selected' : ''}>12%</option>
            <option value="0.18" ${isEdit && p.gst === 0.18 ? 'selected' : ''}>18%</option>
            <option value="0.28" ${isEdit && p.gst === 0.28 ? 'selected' : ''}>28%</option>
          </select>
        </div>
      </div>
      <div id="margin-preview" style="display:none;padding:10px 14px;background:var(--surface-alt);border:1px solid var(--rule);border-radius:5px;font-size:13px;margin-top:8px;"></div>

      <!-- DIMENSIONS -->
      <div style="font-family:var(--font-mono);font-size:10px;color:var(--muted);letter-spacing:0.18em;text-transform:uppercase;margin:24px 0 14px;padding-bottom:10px;border-bottom:1px solid var(--rule);">Dimensions & Weight</div>

      <div class="form-row four">
        <div class="field">
          <label class="field-label">Length</label>
          <input class="input" id="f-len" value="${isEdit ? (p.length || '') : ''}" placeholder="150 cm">
        </div>
        <div class="field">
          <label class="field-label">Breadth</label>
          <input class="input" id="f-breadth" value="${isEdit ? (p.breadth || '') : ''}" placeholder="10 cm">
        </div>
        <div class="field">
          <label class="field-label">Height</label>
          <input class="input" id="f-height" value="${isEdit ? (p.height || '') : ''}" placeholder="1.5 cm">
        </div>
        <div class="field">
          <label class="field-label">Weight</label>
          <input class="input" id="f-weight" value="${isEdit ? (p.weight || '') : ''}" placeholder="80 gm">
        </div>
      </div>

      <!-- FEATURES -->
      <div style="font-family:var(--font-mono);font-size:10px;color:var(--muted);letter-spacing:0.18em;text-transform:uppercase;margin:24px 0 14px;padding-bottom:10px;border-bottom:1px solid var(--rule);">Features & Media</div>

      <div class="form-row full">
        <div class="field">
          <label class="field-label">Feature List</label>
          <textarea class="textarea" id="f-features" placeholder="Separate features with | (pipe)&#10;e.g. 240W max | Braided | Metal shell | 150CM">${isEdit ? (p.features || '') : ''}</textarea>
          <span class="field-hint">Use | to separate features for bullet points</span>
        </div>
      </div>
      <div class="form-row">
        <div class="field">
          <label class="field-label">Google Drive Link</label>
          <input class="input" id="f-drive" value="${isEdit ? (p.drive || '') : ''}" placeholder="https://drive.google.com/drive/folders/...">
          <span class="field-hint">Folder containing product images, infographics, A+ content</span>
        </div>
        <div class="field">
          <label class="field-label">Approved Listing</label>
          <select class="select" id="f-approved">
            <option value="">Not set</option>
            <option value="yes" ${isEdit && p.approved === 'yes' ? 'selected' : ''}>Yes</option>
            <option value="pending" ${isEdit && p.approved === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="no" ${isEdit && p.approved === 'no' ? 'selected' : ''}>No</option>
          </select>
        </div>
      </div>

      <!-- PLATFORM ASSIGNMENT -->
      <div style="font-family:var(--font-mono);font-size:10px;color:var(--muted);letter-spacing:0.18em;text-transform:uppercase;margin:24px 0 14px;padding-bottom:10px;border-bottom:1px solid var(--rule);">Platform Assignment</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;">
        ${PLATFORMS.map(pl => `
          <label style="display:flex;align-items:center;gap:8px;padding:9px 12px;background:var(--surface-alt);border:1px solid var(--rule);border-radius:5px;cursor:pointer;font-size:12px;">
            <input type="checkbox" id="plat-${pl.id}" style="accent-color:var(--accent);">
            <span style="font-family:var(--font-mono);font-size:9px;background:${pl.bg};color:${pl.color};padding:2px 6px;border-radius:2px;">${pl.short}</span>
            ${pl.name}
          </label>
        `).join('')}
      </div>

      <!-- ACTIONS -->
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:32px;padding-top:20px;border-top:1px solid var(--rule);">
        <button class="btn ghost" onclick="resetProductForm()">Reset</button>
        <button class="btn secondary" onclick="showPage('catalogue')">Cancel</button>
        <button class="btn accent" onclick="saveProductForm()">${isEdit ? 'Update Product' : 'Save Product'} →</button>
      </div>
    </div>
  `;
});

function checkDuplicates(name) {
  const wrap = document.getElementById('dupe-warn');
  if (name.length < 5) { wrap.style.display = 'none'; return; }
  const words = name.toLowerCase().split(' ').filter(w => w.length > 3);
  const dupes = PRODUCTS.filter(p => {
    if (editingProductId && p.id === editingProductId) return false;
    const pn = p.name.toLowerCase();
    return words.filter(w => pn.includes(w)).length >= 2;
  }).slice(0, 3);

  if (dupes.length) {
    wrap.style.display = 'block';
    document.getElementById('dupe-warn-content').innerHTML = `
      <strong>${dupes.length} possible duplicate${dupes.length > 1 ? 's' : ''}:</strong><br>
      ${dupes.map(p => `
        <div style="padding:4px 0;font-size:12px;display:flex;justify-content:space-between;align-items:center;">
          <span>#${p.id} — ${shortName(p.name, 50)}</span>
          <button class="btn tiny secondary" onclick="openProductDrawer(${p.id})">View</button>
        </div>
      `).join('')}
    `;
  } else {
    wrap.style.display = 'none';
  }
}

function autoFillHSN() {
  const cat = document.getElementById('f-cat').value;
  const map = {
    'CABLE': '85444290', 'HDMI CABLE': '85444290',
    'CHARGER': '85044000', 'CHR+CBL': '85044000', 'CAR CHARGER': '85044000',
    'REMOTE': '85437099',
    'EXTESNION BOARD': '85363000',
    'MASSAGER': '90191020',
    'CONNECTOR': '85177090',
  };
  const hsn = document.getElementById('f-hsn');
  if (hsn && map[cat] && !hsn.value) hsn.value = map[cat];
}

function calcLiveMargin() {
  const cogs = parseFloat(document.getElementById('f-cogs')?.value) || 0;
  const asp = parseFloat(document.getElementById('f-asp')?.value) || 0;
  const mrp = parseFloat(document.getElementById('f-mrp')?.value) || 0;
  const wrap = document.getElementById('margin-preview');
  if (cogs && asp) {
    wrap.style.display = 'block';
    const margin = Math.round((asp - cogs) / asp * 100);
    const roi = Math.round((asp - cogs) / cogs * 100);
    const discount = mrp ? Math.round((mrp - asp) / mrp * 100) : 0;
    const color = margin > 50 ? 'var(--green)' : margin > 30 ? 'var(--gold)' : 'var(--accent)';
    wrap.innerHTML = `
      <span style="color:${color};font-weight:500;">Gross Margin: ${margin}%</span> &nbsp;·&nbsp;
      ROI on COGS: ${roi}% &nbsp;·&nbsp;
      Discount off MRP: ${discount}%
    `;
  } else {
    wrap.style.display = 'none';
  }
}

function smartImport() {
  const url = document.getElementById('import-url').value.trim();
  if (!url) return;
  const result = document.getElementById('parse-result');
  let info = { detected: false };

  if (url.includes('amazon.in')) {
    info.platform = 'Amazon India';
    info.platformId = 'amazon-in';
    info.detected = true;
    const m = url.match(/\/dp\/([A-Z0-9]+)/);
    if (m) info.asin = m[1];
  } else if (url.includes('amazon.com')) {
    info.platform = 'Amazon Global';
    info.platformId = 'amazon-com';
    info.detected = true;
  } else if (url.includes('flipkart')) { info.platform = 'Flipkart'; info.platformId = 'flipkart'; info.detected = true; }
  else if (url.includes('blinkit')) { info.platform = 'Blinkit'; info.platformId = 'blinkit'; info.detected = true; }
  else if (url.includes('zepto')) { info.platform = 'Zepto'; info.platformId = 'zepto'; info.detected = true; }
  else if (url.includes('drive.google')) {
    info.detected = true;
    info.drive = url;
    document.getElementById('f-drive').value = url;
  }

  // Category guess from URL keywords
  const urlLow = url.toLowerCase();
  if (urlLow.includes('cable')) info.cat = 'CABLE';
  else if (urlLow.includes('charger')) info.cat = 'CHARGER';
  else if (urlLow.includes('remote')) info.cat = 'REMOTE';
  else if (urlLow.includes('massager')) info.cat = 'MASSAGER';

  result.style.display = 'block';
  if (info.detected) {
    result.innerHTML = `
      <div style="background:rgba(46, 197, 86, 0.15);border:1px solid rgba(46, 197, 86, 0.3);border-radius:5px;padding:10px 12px;color:#9ee5b4;font-size:12px;">
        ✓ Detected: ${info.platform || 'Drive folder'}${info.asin ? ' · ASIN: ' + info.asin : ''}${info.cat ? ' · Category: ' + info.cat : ''}<br>
        ${info.cat ? '<span style="color:rgba(255,255,255,0.6);">Category auto-filled. Please complete remaining fields.</span>' : ''}
      </div>
    `;

    if (info.cat) {
      const sel = document.getElementById('f-cat');
      if (sel) { sel.value = info.cat; autoFillHSN(); }
    }
    if (info.platformId) {
      const cb = document.getElementById('plat-' + info.platformId);
      if (cb) cb.checked = true;
    }
  } else {
    result.innerHTML = `
      <div style="color:rgba(255,255,255,0.5);font-size:12px;">
        Could not auto-detect from URL. Fill the form manually.
      </div>
    `;
  }
}

function saveProductForm() {
  const name = document.getElementById('f-name')?.value?.trim();
  const cat = document.getElementById('f-cat')?.value;
  const brand = document.getElementById('f-brand')?.value;
  if (!name || !cat || !brand) {
    showToast('Fill required: Name, Category, Brand', false);
    return;
  }

  const data = {
    name, cat, brand,
    sku_code: document.getElementById('f-sku')?.value || autoGenSKU(cat, brand),
    hsn: document.getElementById('f-hsn')?.value || '',
    desc: document.getElementById('f-desc')?.value || '',
    cogs: parseFloat(document.getElementById('f-cogs')?.value) || 0,
    asp: parseFloat(document.getElementById('f-asp')?.value) || 0,
    mrp: parseFloat(document.getElementById('f-mrp')?.value) || 0,
    gst: parseFloat(document.getElementById('f-gst')?.value) || 0,
    length: document.getElementById('f-len')?.value || '',
    breadth: document.getElementById('f-breadth')?.value || '',
    height: document.getElementById('f-height')?.value || '',
    weight: document.getElementById('f-weight')?.value || '',
    features: document.getElementById('f-features')?.value || '',
    drive: document.getElementById('f-drive')?.value || '',
    approved: document.getElementById('f-approved')?.value || '',
    status: 'active',
    comments: ''
  };

  if (editingProductId) {
    const p = PRODUCTS.find(x => x.id === editingProductId);
    if (p) Object.assign(p, data);
    showToast('Product updated');
  } else {
    const newId = Math.max(...PRODUCTS.map(p => p.id), 0) + 1;
    PRODUCTS.push({ id: newId, ...data });
    document.getElementById('sku-counter').innerHTML = '<strong>' + PRODUCTS.length + '</strong> SKUs';
    showToast('Product saved');
  }

  showPage('catalogue');
}

function autoGenSKU(cat, brand) {
  const catMap = { 'CABLE': 'CBL', 'HDMI CABLE': 'HDM', 'CHARGER': 'CHR', 'CHR+CBL': 'CMB', 'CAR CHARGER': 'CAR', 'REMOTE': 'RM', 'EXTESNION BOARD': 'EXT', 'MASSAGER': 'MSG', 'CONNECTOR': 'CON' };
  const brandMap = { 'ailkin': 'AL', 'qibox': 'QB', 'homemo': 'HM', 'private': 'PV' };
  const id = Math.max(...PRODUCTS.map(p => p.id), 0) + 1;
  return `${catMap[cat] || 'SKU'}-${brandMap[brand] || 'XX'}-${id}`;
}

function resetProductForm() {
  if (confirm('Reset all fields?')) {
    document.querySelectorAll('#page-add-product .input, #page-add-product .select, #page-add-product .textarea').forEach(el => {
      el.value = '';
    });
    document.querySelectorAll('#page-add-product input[type="checkbox"]').forEach(cb => cb.checked = false);
  }
}

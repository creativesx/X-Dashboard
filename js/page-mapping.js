// ═══════════════════════════════════════════
//  BRAND MAPPING PAGE
// ═══════════════════════════════════════════

let mappingState = { brand: 'all', cat: 'all' };

registerPage('mapping', () => {
  document.getElementById('page-mapping').innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-eyebrow">Distribution</div>
        <div class="page-title">Brand × Platform Mapping</div>
        <div class="page-desc">Track which products from each sub-brand are listed on which platforms. Spot coverage gaps quickly.</div>
      </div>
      <div class="page-actions">
        <button class="btn secondary" onclick="exportMappingCSV()">↓ Export Matrix</button>
      </div>
    </div>

    <!-- BRAND TABS -->
    <div class="tabs">
      <div class="tab active" onclick="filterMapping(this, 'all')">All Brands <span class="tab-count">${PRODUCTS.length}</span></div>
      ${Object.entries(BRANDS).map(([k, b]) => `
        <div class="tab" onclick="filterMapping(this, '${k}')">${b.name} <span class="tab-count">${PRODUCTS.filter(p => p.brand === k).length}</span></div>
      `).join('')}
    </div>

    <div class="filter-bar">
      <select class="select" onchange="mappingState.cat = this.value; renderMappingMatrix()" style="min-width:160px;">
        <option value="all">All Categories</option>
        ${CATEGORIES.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
      </select>
    </div>

    <div id="mapping-matrix-wrap"></div>
  `;
  renderMappingMatrix();
});

function filterMapping(el, brand) {
  document.querySelectorAll('#page-mapping .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  mappingState.brand = brand;
  renderMappingMatrix();
}

function renderMappingMatrix() {
  let products = PRODUCTS;
  if (mappingState.brand !== 'all') products = products.filter(p => p.brand === mappingState.brand);
  if (mappingState.cat !== 'all') products = products.filter(p => p.cat === mappingState.cat);

  const livePlatforms = PLATFORMS.filter(p => p.status === 'live' || p.status === 'pending');

  // Coverage stats
  const coverage = livePlatforms.map(pl => {
    const liveCount = products.filter(p =>
      SALES_DATA.some(s => s.pid === p.id && s.plat === pl.id)
    ).length;
    return { ...pl, liveCount, pct: products.length ? Math.round(liveCount / products.length * 100) : 0 };
  });

  document.getElementById('mapping-matrix-wrap').innerHTML = `
    <!-- COVERAGE SUMMARY -->
    <div class="stat-grid" style="grid-template-columns: repeat(${Math.min(coverage.length, 6)}, 1fr); margin-bottom: 24px;">
      ${coverage.map(c => `
        <div class="stat-card" style="cursor:pointer;" onclick="showPage('platform-detail','${c.id}')">
          <div class="stat-card-line" style="background:${c.color}"></div>
          <div class="stat-num" style="font-size: 24px;">${c.liveCount}<small>/${products.length}</small></div>
          <div class="stat-label">${c.short}</div>
          <div class="stat-sub">${c.pct}% covered</div>
        </div>
      `).join('')}
    </div>

    <!-- MATRIX TABLE -->
    <div class="tbl-wrap">
      <table class="tbl">
        <thead>
          <tr>
            <th style="min-width:240px;position:sticky;left:0;background:var(--surface-alt);z-index:2;">Product</th>
            <th>Cat</th>
            <th>Brand</th>
            ${livePlatforms.map(pl => `<th style="text-align:center;min-width:60px;">
              <div style="font-family:var(--font-mono);font-size:9px;background:${pl.bg};color:${pl.color};padding:3px 6px;border-radius:3px;display:inline-block;">${pl.short}</div>
            </th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${products.map(p => `
            <tr class="clickable" onclick="openProductDrawer(${p.id})">
              <td style="position:sticky;left:0;background:var(--white);z-index:1;">
                <div style="font-weight:500;font-size:13px;">${shortName(p.name, 30)}</div>
                <div class="sku-mono">${p.sku_code || '#' + p.id}</div>
              </td>
              <td>${categoryBadge(p.cat)}</td>
              <td style="font-size:12px;color:var(--muted);">${getBrand(p.brand).name}</td>
              ${livePlatforms.map(pl => {
                const live = SALES_DATA.some(s => s.pid === p.id && s.plat === pl.id);
                const units = SALES_DATA.filter(s => s.pid === p.id && s.plat === pl.id).reduce((sum, s) => sum + s.units, 0);
                return `<td style="text-align:center;" onclick="event.stopPropagation()">
                  ${live ? `<span style="color:${pl.color};font-size:14px;font-weight:600;" title="${units} units sold">●</span>` : `<span style="color:var(--rule);font-size:14px;" title="Not listed">○</span>`}
                </td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="hint-box" style="margin-top: 20px;">
      <div class="hint-icon">i</div>
      <div>
        <strong>Legend:</strong> ● = Listed and selling · ○ = Not listed yet. Click any cell or row to drill into the product. Coverage gaps show where you can quickly expand distribution.
      </div>
    </div>
  `;
}

function exportMappingCSV() {
  const livePlatforms = PLATFORMS.filter(p => p.status === 'live' || p.status === 'pending');
  const headers = ['SKU', 'Product', 'Category', 'Brand', ...livePlatforms.map(p => p.short)];
  const rows = [headers];
  PRODUCTS.forEach(p => {
    const row = [p.sku_code || '#'+p.id, p.name, p.cat, getBrand(p.brand).name];
    livePlatforms.forEach(pl => {
      const live = SALES_DATA.some(s => s.pid === p.id && s.plat === pl.id);
      row.push(live ? 'YES' : 'NO');
    });
    rows.push(row);
  });
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'shftx-platform-mapping.csv';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Mapping matrix exported');
}

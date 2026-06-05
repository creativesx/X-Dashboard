// ═══════════════════════════════════════════
//  CATALOGUE PAGE
// ═══════════════════════════════════════════

let catalogueState = {
  view: 'grid', // grid | table
  search: '',
  cat: '',
  brand: '',
  status: '',
  sortBy: 'id',
  sortDir: 1
};

registerPage('catalogue', () => {
  document.getElementById('page-catalogue').innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-eyebrow">Catalogue</div>
        <div class="page-title">All Products</div>
        <div class="page-desc">Click any product to inspect images, specs, sales, and inventory.</div>
      </div>
      <div class="page-actions">
        <div style="display:flex;gap:0;border:1px solid var(--rule);border-radius:5px;overflow:hidden;">
          <button class="btn ghost" id="view-grid-btn" onclick="catalogueSetView('grid')" style="border-radius:0;border:none;${catalogueState.view==='grid'?'background:var(--ink);color:#fff;':''}">⊞ Grid</button>
          <button class="btn ghost" id="view-table-btn" onclick="catalogueSetView('table')" style="border-radius:0;border:none;border-left:1px solid var(--rule);${catalogueState.view==='table'?'background:var(--ink);color:#fff;':''}">▤ Table</button>
        </div>
        <button class="btn accent" onclick="showPage('add-product')">+ Add Product</button>
      </div>
    </div>

    <div class="filter-bar">
      <input class="input" id="cat-search-input" placeholder="Search by name, SKU, code…" value="${catalogueState.search}" oninput="catalogueState.search = this.value; catalogueRender()">
      <select class="select" id="cat-filter" onchange="catalogueState.cat = this.value; catalogueRender()" style="min-width:160px;">
        <option value="">All Categories</option>
        ${CATEGORIES.map(c => `<option value="${c.id}" ${catalogueState.cat === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
      </select>
      <select class="select" id="brand-filter" onchange="catalogueState.brand = this.value; catalogueRender()" style="min-width:120px;">
        <option value="">All Brands</option>
        ${Object.entries(BRANDS).map(([k, b]) => `<option value="${k}" ${catalogueState.brand === k ? 'selected' : ''}>${b.name}</option>`).join('')}
      </select>
      <select class="select" onchange="catalogueState.status = this.value; catalogueRender()" style="min-width:120px;">
        <option value="">All Status</option>
        <option value="active" ${catalogueState.status === 'active' ? 'selected' : ''}>Active</option>
        <option value="inactive" ${catalogueState.status === 'inactive' ? 'selected' : ''}>Inactive</option>
      </select>
      <button class="btn ghost" onclick="catalogueClearFilters()">✕ Clear</button>
    </div>

    <div class="result-count" id="catalogue-count"></div>
    <div id="catalogue-results"></div>
  `;
  catalogueRender();
});

function catalogueSetView(v) {
  catalogueState.view = v;
  showPage('catalogue');
}

function catalogueClearFilters() {
  catalogueState.search = '';
  catalogueState.cat = '';
  catalogueState.brand = '';
  catalogueState.status = '';
  showPage('catalogue');
}

function catalogueGetFiltered() {
  const q = catalogueState.search.toLowerCase();
  return PRODUCTS.filter(p => {
    if (q && !(p.name.toLowerCase().includes(q) || (p.sku_code || '').toLowerCase().includes(q) || p.cat.toLowerCase().includes(q))) return false;
    if (catalogueState.cat && p.cat !== catalogueState.cat) return false;
    if (catalogueState.brand && p.brand !== catalogueState.brand) return false;
    if (catalogueState.status && p.status !== catalogueState.status) return false;
    return true;
  });
}

function catalogueRender() {
  const data = catalogueGetFiltered();
  document.getElementById('catalogue-count').textContent = `Showing ${data.length} of ${PRODUCTS.length} products`;

  const wrap = document.getElementById('catalogue-results');
  if (!data.length) {
    wrap.innerHTML = '<div class="empty-state"><div class="empty-state-text">No products match your filters</div></div>';
    return;
  }

  if (catalogueState.view === 'grid') {
    wrap.innerHTML = `
      <div class="prod-grid">
        ${data.map(p => {
          const drr = getDRR(p.id);
          const hasPrice = p.asp > 0;
          return `
            <div class="prod-card" onclick="openProductDrawer(${p.id})">
              ${productImage(p)}
              <div class="prod-body">
                <div class="prod-name">${p.name}</div>
                <div class="prod-meta">
                  ${categoryBadge(p.cat)}
                  ${drr ? `<span style="font-family:var(--font-mono);font-size:10px;color:var(--muted);">${drr}/day</span>` : '<span style="font-family:var(--font-mono);font-size:10px;color:var(--muted-soft);">no sales yet</span>'}
                </div>
                <div class="prod-price-row">
                  <div>
                    <div class="prod-asp-large">${hasPrice ? inr(p.asp) : '<span style="color:var(--muted-soft);font-weight:400;font-size:13px;">No price</span>'}</div>
                    ${p.mrp ? `<div class="prod-mrp-small">MRP ${inr(p.mrp)}</div>` : ''}
                  </div>
                  <div style="text-align:right;">
                    <div class="prod-cogs-small">COGS</div>
                    <div class="prod-cogs-small" style="color:var(--ink);font-weight:500;">${p.cogs > 0 ? inr(p.cogs) : '—'}</div>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else {
    wrap.innerHTML = `
      <div class="tbl-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th class="sortable" onclick="catalogueSort('id')">#</th>
              <th class="sortable" onclick="catalogueSort('name')">Product</th>
              <th>Category</th>
              <th>Brand</th>
              <th>SKU Code</th>
              <th class="sortable" onclick="catalogueSort('cogs')">COGS</th>
              <th class="sortable" onclick="catalogueSort('asp')">ASP</th>
              <th>MRP</th>
              <th>Margin</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${data.map(p => {
              const m = calcMargin(p);
              return `
                <tr class="clickable" onclick="openProductDrawer(${p.id})">
                  <td class="sku-mono">${p.id}</td>
                  <td><div style="font-weight:500;">${shortName(p.name, 38)}</div></td>
                  <td>${categoryBadge(p.cat)}</td>
                  <td style="text-transform:capitalize;font-size:12px;color:var(--muted);">${getBrand(p.brand).name}</td>
                  <td class="sku-mono">${p.sku_code || '—'}</td>
                  <td class="price-cogs">${inr(p.cogs)}</td>
                  <td class="price-asp">${inr(p.asp)}</td>
                  <td class="price-mrp">${inr(p.mrp)}</td>
                  <td>${m !== null ? `<span style="color:${m > 50 ? 'var(--green)' : m > 30 ? 'var(--gold)' : 'var(--accent)'};font-weight:500;">${m}%</span>` : '<span style="color:var(--muted-soft)">—</span>'}</td>
                  <td>${statusBadge(p.status)}</td>
                  <td onclick="event.stopPropagation()">
                    <button class="btn tiny secondary" onclick="openProductDrawer(${p.id})">View</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
}

function catalogueSort(col) {
  if (catalogueState.sortBy === col) catalogueState.sortDir *= -1;
  else { catalogueState.sortBy = col; catalogueState.sortDir = 1; }
  // Sort PRODUCTS in place
  PRODUCTS.sort((a, b) => {
    const va = a[col] ?? 0, vb = b[col] ?? 0;
    return va < vb ? -catalogueState.sortDir : va > vb ? catalogueState.sortDir : 0;
  });
  catalogueRender();
}

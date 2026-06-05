// ═══════════════════════════════════════════
//  INVENTORY ALLOCATION PAGE
// ═══════════════════════════════════════════

let inventoryState = {
  filter: '',
  category: '',
  showLowStock: false
};

registerPage('inventory', () => {
  // Empty state — no inventory recorded
  if (!INVENTORY_DATA.length) {
    document.getElementById('page-inventory').innerHTML = `
      <div class="page-header">
        <div class="page-header-left">
          <div class="page-eyebrow">Operations</div>
          <div class="page-title">Inventory Allocation</div>
          <div class="page-desc">Track stock split across Amazon FBA, Blinkit dark stores, Flipkart, warehouse, and in-transit.</div>
        </div>
      </div>
      <div class="card" style="padding: 60px 40px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">📦</div>
        <div style="font-family: var(--font-display); font-size: 22px; font-weight: 700; margin-bottom: 8px;">No Inventory Data Yet</div>
        <div style="font-size: 14px; color: var(--muted); max-width: 480px; margin: 0 auto 24px;">
          Add inventory levels per SKU and we'll surface low-stock alerts (using your DRR), allocation recommendations, and a per-platform stack chart.
        </div>
        <button class="btn accent" onclick="entryState={mode:'inventory',csvType:'sales',csvParsed:null,invSearch:'',imgSearch:'',imgFilter:'all'}; showPage('upload')">+ Add Inventory</button>
      </div>
    `;
    return;
  }

  // Compute totals
  const totalUnits = INVENTORY_DATA.reduce((sum, i) => sum + getInvTotal(i), 0);
  const amazonTotal = INVENTORY_DATA.reduce((s, i) => s + (i.amazon || 0), 0);
  const blinkitTotal = INVENTORY_DATA.reduce((s, i) => s + (i.blinkit || 0), 0);
  const flipkartTotal = INVENTORY_DATA.reduce((s, i) => s + (i.flipkart || 0), 0);
  const warehouseTotal = INVENTORY_DATA.reduce((s, i) => s + (i.warehouse || 0), 0);
  const transitTotal = INVENTORY_DATA.reduce((s, i) => s + (i.in_transit || 0), 0);

  const lowStockProducts = INVENTORY_DATA.filter(i => {
    const p = PRODUCTS.find(x => x.id === i.pid);
    if (!p) return false;
    const drr = getDRR(i.pid);
    if (!drr || drr <= 0) return false;
    const days = getInvTotal(i) / drr;
    return days < 30;
  }).length;

  document.getElementById('page-inventory').innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-eyebrow">Operations</div>
        <div class="page-title">Inventory Allocation</div>
        <div class="page-desc">Manage stock distribution across Amazon FBA, Blinkit dark stores, Flipkart warehouses and your own warehouse.</div>
      </div>
      <div class="page-actions">
        <button class="btn secondary" onclick="showPage('upload')">↑ Upload Inventory</button>
        <button class="btn accent" onclick="openAllocationFlow()">+ New Allocation</button>
      </div>
    </div>

    <!-- TOP STATS -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-card-line" style="background:var(--ink)"></div>
        <div class="stat-num">${totalUnits.toLocaleString('en-IN')}</div>
        <div class="stat-label">Total Inventory</div>
        <div class="stat-sub">Across all channels</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-line" style="background:#FF9900"></div>
        <div class="stat-num">${amazonTotal.toLocaleString('en-IN')}</div>
        <div class="stat-label">Amazon FBA</div>
        <div class="stat-sub">${totalUnits ? Math.round(amazonTotal/totalUnits*100) : 0}% of total</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-line" style="background:#F8C400"></div>
        <div class="stat-num">${blinkitTotal.toLocaleString('en-IN')}</div>
        <div class="stat-label">Blinkit</div>
        <div class="stat-sub">${totalUnits ? Math.round(blinkitTotal/totalUnits*100) : 0}% of total</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-line" style="background:#2874F0"></div>
        <div class="stat-num">${flipkartTotal.toLocaleString('en-IN')}</div>
        <div class="stat-label">Flipkart</div>
        <div class="stat-sub">${totalUnits ? Math.round(flipkartTotal/totalUnits*100) : 0}% of total</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-line" style="background:var(--ink-mid)"></div>
        <div class="stat-num">${warehouseTotal.toLocaleString('en-IN')}</div>
        <div class="stat-label">Warehouse</div>
        <div class="stat-sub">Self-managed</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-line" style="background:var(--accent)"></div>
        <div class="stat-num">${lowStockProducts}</div>
        <div class="stat-label">Low Stock Alert</div>
        <div class="stat-sub">< 30 days at current DRR</div>
      </div>
    </div>

    <!-- ALLOCATION OVERVIEW -->
    <div class="sec-title">Allocation Overview <div class="sec-title-line"></div></div>
    <div class="card" style="margin-bottom: 28px;">
      <div class="alloc-stack" style="height: 32px;">
        ${[
          { l: 'Amazon FBA', v: amazonTotal, c: '#FF9900' },
          { l: 'Blinkit', v: blinkitTotal, c: '#F8C400' },
          { l: 'Flipkart', v: flipkartTotal, c: '#2874F0' },
          { l: 'Warehouse', v: warehouseTotal, c: '#3A3020' },
          { l: 'In Transit', v: transitTotal, c: '#999' },
        ].filter(s => s.v > 0).map(s => `
          <div class="alloc-segment" style="background:${s.c};width:${s.v/totalUnits*100}%;font-size:11px;" title="${s.l}: ${s.v}">${s.v/totalUnits > 0.06 ? s.l + ': ' + s.v : ''}</div>
        `).join('')}
      </div>
    </div>

    <!-- FILTER BAR -->
    <div class="filter-bar">
      <input class="input" placeholder="Search product..." oninput="inventoryState.filter = this.value; renderInventoryTable()">
      <select class="select" onchange="inventoryState.category = this.value; renderInventoryTable()" style="min-width:160px;">
        <option value="">All Categories</option>
        ${CATEGORIES.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
      </select>
      <label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;">
        <input type="checkbox" onchange="inventoryState.showLowStock = this.checked; renderInventoryTable()" style="accent-color:var(--accent);"> Show only low-stock
      </label>
    </div>

    <!-- INVENTORY TABLE -->
    <div id="inventory-table-wrap"></div>

    <div style="margin-top: 28px;" class="hint-box">
      <div class="hint-icon">i</div>
      <div>
        <strong>How allocation works:</strong> Each SKU gets split across channels based on velocity and platform demand. Use the per-product allocator to set new send-in quantities for Amazon FBA shipments or Blinkit dark store top-ups.
      </div>
    </div>
  `;
  renderInventoryTable();
});

function renderInventoryTable() {
  const q = inventoryState.filter.toLowerCase();
  const data = INVENTORY_DATA
    .map(inv => {
      const p = PRODUCTS.find(x => x.id === inv.pid);
      if (!p) return null;
      if (q && !p.name.toLowerCase().includes(q)) return null;
      if (inventoryState.category && p.cat !== inventoryState.category) return null;
      const drr = getDRR(p.id);
      const total = getInvTotal(inv);
      const days = (drr && drr > 0) ? Math.round(total / drr) : null;
      const lowStock = drr && drr > 0 && days && days < 30;
      if (inventoryState.showLowStock && !lowStock) return null;
      return { ...p, ...inv, drr, total, days, lowStock };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.lowStock && !b.lowStock) return -1;
      if (!a.lowStock && b.lowStock) return 1;
      return b.total - a.total;
    });

  const wrap = document.getElementById('inventory-table-wrap');
  if (!data.length) {
    wrap.innerHTML = '<div class="empty-state"><div class="empty-state-text">No inventory matches filters</div></div>';
    return;
  }

  wrap.innerHTML = `
    <div class="tbl-wrap">
      <table class="tbl">
        <thead>
          <tr>
            <th>Product</th>
            <th>Cat</th>
            <th>Amazon</th>
            <th>Blinkit</th>
            <th>Flipkart</th>
            <th>Warehouse</th>
            <th>In Transit</th>
            <th>Total</th>
            <th>DRR</th>
            <th>Days Left</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${data.map(r => `
            <tr class="clickable" onclick="openProductDrawer(${r.id})">
              <td>
                <div style="font-weight:500;font-size:13px;">${shortName(r.name, 30)}</div>
                <div class="sku-mono">${r.sku_code || '#' + r.id}</div>
              </td>
              <td>${categoryBadge(r.cat)}</td>
              <td class="sku-mono">${r.amazon || 0}</td>
              <td class="sku-mono">${r.blinkit || 0}</td>
              <td class="sku-mono">${r.flipkart || 0}</td>
              <td class="sku-mono">${r.warehouse || 0}</td>
              <td class="sku-mono" style="color:var(--muted);">${r.in_transit || 0}</td>
              <td><strong style="font-family:var(--font-mono);">${r.total}</strong></td>
              <td class="sku-mono">${r.drr || '—'}</td>
              <td>${r.days !== null ? `<span style="color:${r.days < 15 ? 'var(--accent)' : r.days < 30 ? 'var(--gold)' : 'var(--green)'};font-weight:500;font-size:12px;">${r.days}d</span>` : '<span style="color:var(--muted-soft)">—</span>'}</td>
              <td onclick="event.stopPropagation()">
                <button class="btn tiny" onclick="openAllocateForProduct(${r.id})">Allocate</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function openAllocationFlow() {
  showToast('Opening allocation flow...');
  showPage('upload');
}

function openAllocateForProduct(pid) {
  const p = PRODUCTS.find(x => x.id === pid);
  if (!p) return;
  const inv = getProductInv(pid);
  const drr = getDRR(pid);

  document.getElementById('drawer-body-content').innerHTML = `
    <div class="drawer-hero">
      <div class="drawer-hero-sku">ALLOCATE STOCK · ${p.sku_code || '#' + p.id}</div>
      <div class="drawer-hero-name">${p.name}</div>
      <div class="drawer-hero-meta">
        ${categoryBadge(p.cat)}
        <span class="status-pill" style="background:rgba(255,255,255,0.12);color:#fff">DRR: ${drr ? drr + "/day" : "no sales yet"}</span>
      </div>
    </div>
    <div class="drawer-body">
      <div class="hint-box">
        <div class="hint-icon">i</div>
        <div><strong>Daily Run Rate:</strong> ${drr} units/day. Maintain at least 30 days of stock per active channel.</div>
      </div>

      <div class="drawer-section-title">Current Allocation</div>
      <div class="form-row">
        <div class="field">
          <label class="field-label">Amazon FBA</label>
          <input class="input" type="number" id="alloc-amazon" value="${inv.amazon}">
        </div>
        <div class="field">
          <label class="field-label">Blinkit</label>
          <input class="input" type="number" id="alloc-blinkit" value="${inv.blinkit}">
        </div>
      </div>
      <div class="form-row">
        <div class="field">
          <label class="field-label">Flipkart</label>
          <input class="input" type="number" id="alloc-flipkart" value="${inv.flipkart}">
        </div>
        <div class="field">
          <label class="field-label">Warehouse (own)</label>
          <input class="input" type="number" id="alloc-warehouse" value="${inv.warehouse}">
        </div>
      </div>
      <div class="form-row full">
        <div class="field">
          <label class="field-label">In Transit (incoming)</label>
          <input class="input" type="number" id="alloc-transit" value="${inv.in_transit}">
        </div>
      </div>

      <div class="hint-box green">
        <div class="hint-icon" style="background:var(--green);color:var(--green-soft);">✓</div>
        <div>
          <strong>Recommendations based on DRR ${drr}/day:</strong><br>
          • Amazon FBA target: <strong>${Math.round(drr * 30)} units</strong> (30-day buffer)<br>
          • Blinkit target: <strong>${Math.round(drr * 14)} units</strong> (14-day buffer for q-commerce)<br>
          • Flipkart target: <strong>${Math.round(drr * 21)} units</strong> (21-day buffer)
        </div>
      </div>

      <div class="drawer-actions">
        <button class="btn secondary" onclick="closeDrawer()">Cancel</button>
        <button class="btn accent" onclick="saveAllocation(${pid})">Save Allocation</button>
      </div>
    </div>
  `;
  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawer-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function saveAllocation(pid) {
  const inv = INVENTORY_DATA.find(i => i.pid === pid);
  if (!inv) return;
  inv.amazon = parseInt(document.getElementById('alloc-amazon').value) || 0;
  inv.blinkit = parseInt(document.getElementById('alloc-blinkit').value) || 0;
  inv.flipkart = parseInt(document.getElementById('alloc-flipkart').value) || 0;
  inv.warehouse = parseInt(document.getElementById('alloc-warehouse').value) || 0;
  inv.in_transit = parseInt(document.getElementById('alloc-transit').value) || 0;
  closeDrawer();
  showToast('Allocation saved');
  showPage('inventory');
}

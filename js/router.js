// ═══════════════════════════════════════════
//  ROUTER & PAGE NAVIGATION
// ═══════════════════════════════════════════

let currentPage = 'dashboard';
let currentPageParam = null;
let drawerOpen = false;

const PAGE_RENDERERS = {};

function registerPage(id, renderFn) {
  PAGE_RENDERERS[id] = renderFn;
}

function showPage(pageId, param = null) {
  currentPage = pageId;
  currentPageParam = param;

  // Hide all
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));

  const el = document.getElementById('page-' + pageId);
  if (!el) {
    document.getElementById('page-not-found')?.classList.add('active');
    return;
  }
  el.classList.add('active');

  // Activate sidebar item
  document.querySelectorAll('.sidebar-item').forEach(item => {
    if (item.dataset.page === pageId) item.classList.add('active');
  });

  // Run renderer
  const fn = PAGE_RENDERERS[pageId];
  if (fn) {
    try { fn(param); } catch(e) { console.error('Render error', pageId, e); }
  }

  // Scroll top
  window.scrollTo(0, 0);
}

// Global search
function handleGlobalSearch(q) {
  if (!q || q.length < 2) return;
  showPage('catalogue');
  setTimeout(() => {
    const el = document.getElementById('cat-search-input');
    if (el) {
      el.value = q;
      el.dispatchEvent(new Event('input'));
    }
  }, 50);
}

// Drawer
function openProductDrawer(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;

  const inv = getProductInv(p.id);
  const drr = getDRR(p.id);
  const totalUnits = getProductTotalUnits(p.id);
  const totalRevenue = getProductTotalRevenue(p.id);
  const margin = calcMargin(p);
  const c = getCat(p.cat);
  const brand = getBrand(p.brand);

  const features = (p.features || '').split('|').map(s => s.trim()).filter(Boolean);

  const platforms_with_sales = ['amazon-in','amazon-com','flipkart','blinkit','zepto'].map(plat => ({
    plat,
    units: SALES_DATA.filter(s => s.pid === p.id && s.plat === plat).reduce((sum, s) => sum + s.units, 0)
  })).filter(x => x.units > 0);

  const drawerBody = document.getElementById('drawer-body-content');
  drawerBody.innerHTML = `
    <div class="drawer-hero">
      <div class="drawer-hero-sku">${p.sku_code || `#${p.id}`} · ${p.cat} · ${brand.name}</div>
      <div class="drawer-hero-name">${p.name}</div>
      <div class="drawer-hero-meta">
        ${categoryBadge(p.cat)}
        ${statusBadge(p.status)}
        ${p.approved === 'yes' ? '<span class="status-pill" style="background:rgba(255,255,255,0.12);color:#fff">Listing approved</span>' : (p.approved === 'pending' ? '<span class="status-pill pending">Approval pending</span>' : '')}
      </div>
    </div>

    <div class="drawer-body">
      <!-- IMAGE GALLERY -->
      <div class="drawer-section-title">Product Images</div>
      <div class="drawer-img-grid">
        ${[1,2,3,4,5,6].map((n,i) => `
          <div class="drawer-img-tile" onclick="${p.drive ? `window.open('${p.drive}','_blank')` : ''}" title="${p.drive ? 'Open Drive folder' : 'No drive link'}">
            ${i === 0 ? `<div style="text-align:center;font-family:var(--font-display);font-size:20px;font-weight:800;color:${c.color};">${productInitials(p.name, p.cat).initial}<div style="font-family:var(--font-mono);font-size:8px;color:var(--muted);margin-top:4px;">HERO</div></div>` : `IMG ${n}`}
          </div>
        `).join('')}
      </div>
      ${p.drive ? `<div style="margin: -8px 0 20px;"><a href="${p.drive}" target="_blank" style="font-size:12px;color:var(--accent);font-family:var(--font-mono);">↗ Open full Drive folder</a></div>` : '<div style="margin: -8px 0 20px;"><span style="font-size:12px;color:var(--muted);font-style:italic;">No Drive folder linked yet</span></div>'}

      <!-- KPIs -->
      <div class="stat-grid" style="grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 24px;">
        <div class="stat-card" style="padding: 12px;">
          <div class="stat-num" style="font-size: 22px;">${drr !== null && drr > 0 ? drr : '—'}</div>
          <div class="stat-label" style="font-size: 9px;">DRR / day</div>
        </div>
        <div class="stat-card" style="padding: 12px;">
          <div class="stat-num" style="font-size: 22px;">${totalUnits || '—'}</div>
          <div class="stat-label" style="font-size: 9px;">Total Units</div>
        </div>
        <div class="stat-card" style="padding: 12px;">
          <div class="stat-num" style="font-size: 22px;">${totalRevenue > 0 ? inrShort(totalRevenue) : '—'}</div>
          <div class="stat-label" style="font-size: 9px;">Total Revenue</div>
        </div>
        <div class="stat-card" style="padding: 12px;">
          <div class="stat-num" style="font-size: 22px;">${margin !== null ? margin + '%' : '—'}</div>
          <div class="stat-label" style="font-size: 9px;">Margin</div>
        </div>
      </div>

      <!-- TWO COLUMN -->
      <div class="drawer-grid">
        <div>
          <div class="drawer-section-title">Pricing</div>
          <div class="drawer-spec"><span class="drawer-spec-key">COGS</span><span class="drawer-spec-val price-cogs">${inr(p.cogs)}</span></div>
          <div class="drawer-spec"><span class="drawer-spec-key">Suggested ASP</span><span class="drawer-spec-val price-asp" style="font-size:14px">${inr(p.asp)}</span></div>
          <div class="drawer-spec"><span class="drawer-spec-key">MRP</span><span class="drawer-spec-val price-mrp">${inr(p.mrp)}</span></div>
          <div class="drawer-spec"><span class="drawer-spec-key">GST</span><span class="drawer-spec-val">${p.gst ? Math.round(p.gst*100) + '%' : '—'}</span></div>
          <div class="drawer-spec"><span class="drawer-spec-key">HSN Code</span><span class="drawer-spec-val sku-mono">${p.hsn || '—'}</span></div>
        </div>
        <div>
          <div class="drawer-section-title">Specifications</div>
          <div class="drawer-spec"><span class="drawer-spec-key">SKU Code</span><span class="drawer-spec-val sku-mono">${p.sku_code || '—'}</span></div>
          <div class="drawer-spec"><span class="drawer-spec-key">Length</span><span class="drawer-spec-val">${p.length || '—'}</span></div>
          <div class="drawer-spec"><span class="drawer-spec-key">Breadth</span><span class="drawer-spec-val">${p.breadth || '—'}</span></div>
          <div class="drawer-spec"><span class="drawer-spec-key">Height</span><span class="drawer-spec-val">${p.height || '—'}</span></div>
          <div class="drawer-spec"><span class="drawer-spec-key">Weight</span><span class="drawer-spec-val">${p.weight || '—'}</span></div>
        </div>
      </div>

      <!-- INVENTORY ALLOCATION -->
      <div class="drawer-section-title">Inventory Allocation</div>
      <div style="margin-bottom: 8px;">
        ${(() => {
          const total = getInvTotal(inv);
          if (total === 0) return '<div style="font-size:12px;color:var(--muted);font-style:italic;">No inventory data</div>';
          const segs = [
            { l: 'Amazon FBA', v: inv.amazon, c: '#FF9900' },
            { l: 'Blinkit', v: inv.blinkit, c: '#F8C400' },
            { l: 'Flipkart', v: inv.flipkart, c: '#2874F0' },
            { l: 'Warehouse', v: inv.warehouse, c: '#3A3020' },
            { l: 'In Transit', v: inv.in_transit, c: '#999' },
          ].filter(s => s.v > 0);
          return `
            <div class="alloc-stack">
              ${segs.map(s => `<div class="alloc-segment" style="background:${s.c};width:${s.v/total*100}%" title="${s.l}: ${s.v}">${s.v/total > 0.08 ? s.v : ''}</div>`).join('')}
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:14px;margin-top:10px;font-size:11px;">
              ${segs.map(s => `<span style="display:flex;align-items:center;gap:5px;"><span style="width:8px;height:8px;background:${s.c};border-radius:2px;"></span>${s.l}: <strong>${s.v}</strong></span>`).join('')}
              <span style="margin-left:auto;color:var(--muted);font-family:var(--font-mono);">Total: ${total} units</span>
            </div>
          `;
        })()}
      </div>

      <!-- PLATFORMS -->
      <div class="drawer-section-title" style="margin-top: 24px;">Platform Sales (6 Months)</div>
      ${platforms_with_sales.length > 0 ? `
        <div style="background: var(--surface-alt); border-radius: 6px; padding: 14px;">
          ${(() => {
            const max = Math.max(...platforms_with_sales.map(x => x.units));
            return platforms_with_sales.map(x => {
              const pl = getPlatform(x.plat);
              return `
                <div class="bar-chart-row">
                  <div class="bar-chart-label">${pl.name}</div>
                  <div class="bar-chart-track">
                    <div class="bar-chart-fill" style="width:${x.units/max*100}%;background:${pl.color};"></div>
                  </div>
                  <div class="bar-chart-val">${x.units} u</div>
                </div>
              `;
            }).join('');
          })()}
        </div>
      ` : '<div style="font-size:12px;color:var(--muted);font-style:italic;">No platform sales data yet</div>'}

      <!-- FEATURES -->
      ${features.length ? `
        <div class="drawer-section-title" style="margin-top: 24px;">Key Features</div>
        <ul class="drawer-feature-list">
          ${features.map(f => `<li>${f}</li>`).join('')}
        </ul>
      ` : ''}

      <!-- DESCRIPTION -->
      ${p.desc && p.desc !== '0' ? `
        <div class="drawer-section-title" style="margin-top: 24px;">Description</div>
        <div style="font-size: 13px; color: var(--ink-mid); line-height: 1.7;">${p.desc}</div>
      ` : ''}

      <!-- COMMENTS -->
      ${p.comments && p.comments !== '0' ? `
        <div class="drawer-section-title" style="margin-top: 24px;">Internal Comments</div>
        <div style="background: var(--gold-soft); border: 1px solid var(--gold-line); border-radius: 6px; padding: 12px; font-size: 12px; color: var(--ink-mid); line-height: 1.6;">${p.comments}</div>
      ` : ''}

      <div class="drawer-actions">
        <button class="btn secondary" onclick="closeDrawer()">Close</button>
        <button class="btn secondary" onclick="closeDrawer(); showPage('add-product', ${p.id})">Edit</button>
        ${p.drive ? `<a href="${p.drive}" target="_blank"><button class="btn secondary">↗ Drive Folder</button></a>` : ''}
        <button class="btn accent" onclick="closeDrawer(); showPage('sales', ${p.id})">View Sales →</button>
      </div>
    </div>
  `;

  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawer-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  drawerOpen = true;
}

function closeDrawer() {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawer-overlay').classList.remove('open');
  document.body.style.overflow = '';
  drawerOpen = false;
}

// ═══════════════════════════════════════════
//  PLATFORMS PAGE
// ═══════════════════════════════════════════

registerPage('platforms', () => {
  document.getElementById('page-platforms').innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-eyebrow">Distribution</div>
        <div class="page-title">Platforms</div>
        <div class="page-desc">Multi-channel distribution across marketplaces, q-commerce, and grocery platforms.</div>
      </div>
      <div class="page-actions">
        <button class="btn accent" onclick="showPage('upload')">+ Add New Platform</button>
      </div>
    </div>

    <!-- TYPE TABS -->
    <div class="tabs">
      <div class="tab active" onclick="filterPlatforms(this, 'all')">All <span class="tab-count">${PLATFORMS.length}</span></div>
      <div class="tab" onclick="filterPlatforms(this, 'live')">Live <span class="tab-count">${PLATFORMS.filter(p=>p.status==='live').length}</span></div>
      <div class="tab" onclick="filterPlatforms(this, 'pending')">Pending Setup <span class="tab-count">${PLATFORMS.filter(p=>p.status==='pending').length}</span></div>
      <div class="tab" onclick="filterPlatforms(this, 'plan')">Planned <span class="tab-count">${PLATFORMS.filter(p=>p.status==='plan').length}</span></div>
    </div>

    <div id="platform-grid-wrap"></div>
  `;
  renderPlatformGrid('all');
});

function filterPlatforms(el, status) {
  document.querySelectorAll('#page-platforms .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderPlatformGrid(status);
}

function renderPlatformGrid(filter) {
  const list = filter === 'all' ? PLATFORMS : PLATFORMS.filter(p => p.status === filter);
  const wrap = document.getElementById('platform-grid-wrap');
  wrap.innerHTML = `
    <div class="platform-grid">
      ${list.map(p => {
        const rev = getPlatformTotalRevenue(p.id);
        const units = getPlatformTotalUnits(p.id);
        const skuCount = getPlatformProductCount(p.id);
        return `
          <div class="platform-card" onclick="showPage('platform-detail','${p.id}')">
            <div class="platform-head">
              <div class="platform-logo" style="background:${p.color}">${p.short}</div>
              <div style="flex:1;">
                <div class="platform-name">${p.name}</div>
                <div class="platform-type">${p.type}</div>
              </div>
              ${statusBadge(p.status)}
            </div>
            <div class="platform-stats-row">
              <div>
                <div class="platform-stat-num" style="color:${p.color};">${skuCount}</div>
                <div class="platform-stat-lbl">Live SKUs</div>
              </div>
              <div>
                <div class="platform-stat-num">${inrShort(rev)}</div>
                <div class="platform-stat-lbl">Revenue</div>
              </div>
              <div>
                <div class="platform-stat-num">${units || 0}</div>
                <div class="platform-stat-lbl">Units</div>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ═══════════════════════════════════════════
//  PLATFORM DETAIL PAGE
// ═══════════════════════════════════════════

registerPage('platform-detail', (platformId) => {
  const p = getPlatform(platformId);
  if (!p) {
    document.getElementById('page-platform-detail').innerHTML = `<div class="empty-state"><div class="empty-state-text">Platform not found</div></div>`;
    return;
  }

  const rev = getPlatformTotalRevenue(p.id);
  const units = getPlatformTotalUnits(p.id);
  const recentRev = getPlatformTotalRevenue(p.id, 0);
  const skuCount = getPlatformProductCount(p.id);

  const platformProducts = PRODUCTS.map(prod => ({
    ...prod,
    revenue: SALES_DATA.filter(s => s.pid === prod.id && s.plat === platformId).reduce((sum, s) => sum + s.revenue, 0),
    units: SALES_DATA.filter(s => s.pid === prod.id && s.plat === platformId).reduce((sum, s) => sum + s.units, 0)
  })).filter(x => x.revenue > 0).sort((a, b) => b.revenue - a.revenue);

  // Category split for this platform
  const catRev = {};
  CATEGORIES.forEach(c => { catRev[c.id] = 0; });
  platformProducts.forEach(p => { catRev[p.cat] = (catRev[p.cat] || 0) + p.revenue; });
  const totalCatRev = Object.values(catRev).reduce((s, v) => s + v, 0);

  document.getElementById('page-platform-detail').innerHTML = `
    <div class="crumb">
      <a onclick="showPage('platforms')">Platforms</a>
      <span class="crumb-sep">›</span>
      <span class="crumb-current">${p.name}</span>
    </div>

    <div class="page-header">
      <div class="page-header-left" style="display:flex;align-items:center;gap:18px;">
        <div class="platform-logo" style="background:${p.color};width:60px;height:60px;font-size:14px;border-radius:10px;">${p.short}</div>
        <div>
          <div class="page-eyebrow">${p.type}</div>
          <div class="page-title">${p.name}</div>
          <div style="display:flex;align-items:center;gap:10px;margin-top:6px;">
            ${statusBadge(p.status)}
            <a href="${p.url}" target="_blank" style="font-size:12px;color:var(--accent);font-family:var(--font-mono);">↗ Visit Site</a>
          </div>
        </div>
      </div>
      <div class="page-actions">
        <button class="btn secondary" onclick="showPage('upload')">↑ Upload ${p.name} Sales</button>
        <button class="btn accent" onclick="showPage('add-product')">+ List New Product</button>
      </div>
    </div>

    <!-- STATS -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-card-line" style="background:${p.color}"></div>
        <div class="stat-num">${inrShort(rev)}</div>
        <div class="stat-label">Total Revenue</div>
        <div class="stat-sub">6 months</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-line" style="background:var(--accent)"></div>
        <div class="stat-num">${inrShort(recentRev)}</div>
        <div class="stat-label">Last 30 Days</div>
        <div class="stat-sub">${rev ? Math.round(recentRev / rev * 100) : 0}% of total</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-line" style="background:var(--blue)"></div>
        <div class="stat-num">${units}</div>
        <div class="stat-label">Units Sold</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-line" style="background:var(--green)"></div>
        <div class="stat-num">${skuCount}<small>/${PRODUCTS.length}</small></div>
        <div class="stat-label">SKUs Live</div>
        <div class="stat-sub">${Math.round(skuCount / PRODUCTS.length * 100)}% catalog coverage</div>
      </div>
    </div>

    <!-- TWO COL -->
    <div style="display: grid; grid-template-columns: 1fr 1.4fr; gap: 20px; margin-bottom: 28px;">

      <!-- CATEGORY SPLIT -->
      <div>
        <div class="sec-title">Category Performance <div class="sec-title-line"></div></div>
        <div class="card" style="padding: 16px;">
          ${(() => {
            const sorted = Object.entries(catRev).filter(([,v]) => v > 0).sort((a,b) => b[1] - a[1]);
            const max = sorted.length ? sorted[0][1] : 1;
            return sorted.map(([cid, v]) => {
              const c = getCat(cid);
              return `
                <div style="padding:10px 0;border-bottom:1px solid var(--rule-soft);cursor:pointer;" onclick="showPage('catalogue'); setTimeout(()=>{const el=document.getElementById('cat-filter');if(el){el.value='${cid}';el.dispatchEvent(new Event('change'));}},80)">
                  <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
                    <span class="cat-badge" style="background:${c.color}">${c.name}</span>
                    <span style="font-family:var(--font-mono);font-size:12px;font-weight:500;">${inrShort(v)}</span>
                  </div>
                  <div class="bar-chart-track" style="height:5px;">
                    <div class="bar-chart-fill" style="width:${v/max*100}%;background:${c.color};"></div>
                  </div>
                  <div style="font-size:10px;color:var(--muted);margin-top:3px;">${Math.round(v/totalCatRev*100)}% of platform</div>
                </div>
              `;
            }).join('') || '<div style="text-align:center;padding:30px;color:var(--muted);font-size:12px;">No sales data yet</div>';
          })()}
        </div>
      </div>

      <!-- TOP PRODUCTS -->
      <div>
        <div class="sec-title">Top Products on ${p.name} <div class="sec-title-line"></div></div>
        <div class="tbl-wrap">
          <table class="tbl">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Cat</th>
                <th>Units</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              ${platformProducts.slice(0, 12).map((p, i) => `
                <tr class="clickable" onclick="openProductDrawer(${p.id})">
                  <td class="sku-mono">${i+1}</td>
                  <td><div style="font-weight:500;">${shortName(p.name, 32)}</div><div class="sku-mono">${p.sku_code || '#'+p.id}</div></td>
                  <td>${categoryBadge(p.cat)}</td>
                  <td class="sku-mono">${p.units}</td>
                  <td><strong style="font-family:var(--font-mono);">${inrShort(p.revenue)}</strong></td>
                </tr>
              `).join('') || '<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--muted);">No products listed yet</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- COVERAGE GAPS -->
    <div class="sec-title">Coverage Gaps <div class="sec-title-line"></div><span class="right">Products not yet listed on ${p.name}</span></div>
    <div class="card">
      <div class="hint-box gold" style="margin-bottom: 14px;">
        <div class="hint-icon" style="color:var(--gold-soft);background:var(--gold);">!</div>
        <div>${PRODUCTS.length - skuCount} products in your catalogue are not listed on ${p.name}. Prioritize high-DRR products for quick wins.</div>
      </div>
      <div class="prod-grid" style="grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));">
        ${PRODUCTS.filter(prod => !platformProducts.find(pp => pp.id === prod.id)).slice(0, 12).map(prod => `
          <div class="card" style="padding:12px;cursor:pointer;" onclick="openProductDrawer(${prod.id})">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
              ${categoryBadge(prod.cat)}
            </div>
            <div style="font-size:12px;font-weight:500;line-height:1.35;">${shortName(prod.name, 36)}</div>
            <div class="sku-mono" style="margin-top:4px;">${prod.sku_code || '#'+prod.id}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
});

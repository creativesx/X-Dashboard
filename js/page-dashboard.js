// ═══════════════════════════════════════════
//  DASHBOARD PAGE
// ═══════════════════════════════════════════

registerPage('dashboard', () => {
  const totalSKUs = PRODUCTS.length;
  const activeSKUs = PRODUCTS.filter(p => p.status === 'active').length;
  const totalRevenue = SALES_DATA.reduce((sum, s) => sum + s.revenue, 0);
  const totalUnits = SALES_DATA.reduce((sum, s) => sum + s.units, 0);
  const recentRevenue = SALES_DATA.filter(s => s.month === 0).reduce((sum, s) => sum + s.revenue, 0);
  const prevRevenue = SALES_DATA.filter(s => s.month === 1).reduce((sum, s) => sum + s.revenue, 0);
  const trend = prevRevenue ? Math.round((recentRevenue - prevRevenue) / prevRevenue * 100) : null;

  const productsWithASP = PRODUCTS.filter(p => p.asp > 0);
  const aspAvg = productsWithASP.length ? productsWithASP.reduce((sum, p) => sum + p.asp, 0) / productsWithASP.length : null;
  const productsWithCogs = PRODUCTS.filter(p => p.cogs > 0 && p.asp > 0);
  const avgMarginPct = productsWithCogs.length
    ? Math.round(productsWithCogs.reduce((s, p) => s + (p.asp - p.cogs)/p.asp*100, 0) / productsWithCogs.length)
    : null;

  const hasSales = SALES_DATA.length > 0;
  const hasInv = INVENTORY_DATA.length > 0;

  // Categories breakdown
  const catCounts = {};
  PRODUCTS.forEach(p => { catCounts[p.cat] = (catCounts[p.cat] || 0) + 1; });

  // Top products by revenue
  const productRevenue = {};
  SALES_DATA.forEach(s => { productRevenue[s.pid] = (productRevenue[s.pid] || 0) + s.revenue; });
  const topProducts = PRODUCTS
    .map(p => ({ ...p, revenue: productRevenue[p.id] || 0, units: getProductTotalUnits(p.id) }))
    .filter(p => p.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  // Platform breakdown
  const platformBreakdown = PLATFORMS.map(pl => ({
    ...pl,
    revenue: getPlatformTotalRevenue(pl.id),
    units: getPlatformTotalUnits(pl.id),
    skus: getPlatformProductCount(pl.id)
  })).sort((a, b) => b.revenue - a.revenue);

  // Brand breakdown
  const brandData = {};
  Object.keys(BRANDS).forEach(b => {
    const prods = PRODUCTS.filter(p => p.brand === b);
    brandData[b] = {
      count: prods.length,
      revenue: prods.reduce((sum, p) => sum + (productRevenue[p.id] || 0), 0)
    };
  });

  document.getElementById('page-dashboard').innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-eyebrow">Master Dashboard</div>
        <div class="page-title">Overview</div>
        <div class="page-desc">${PRODUCTS.length} SKUs in catalogue · ${hasSales ? SALES_DATA.length + ' sales rows recorded' : 'No sales data yet'} · ${hasInv ? INVENTORY_DATA.length + ' SKUs with inventory' : 'No inventory data yet'}</div>
      </div>
      <div class="page-actions">
        <button class="btn secondary" onclick="showPage('upload')">+ Add Data</button>
        <button class="btn accent" onclick="showPage('add-product')">+ Add Product</button>
      </div>
    </div>

    ${!hasSales ? `
      <div class="card" style="padding: 20px 24px; margin-bottom: 24px; background: var(--gold-soft); border-color: var(--gold-line); display: flex; gap: 18px; align-items: center;">
        <div style="font-size: 28px;">📊</div>
        <div style="flex:1;">
          <div style="font-family: var(--font-display); font-size: 15px; font-weight: 700; color: var(--gold); letter-spacing: 0.02em; margin-bottom: 4px;">NO SALES DATA RECORDED</div>
          <div style="font-size: 13px; color: #5A4A1A;">Revenue, DRR, top sellers and platform breakdowns will populate as soon as you add sales entries. Manual entry takes ~10 seconds per row.</div>
        </div>
        <button class="btn accent" onclick="showPage('upload')">Add Sales →</button>
      </div>
    ` : ''}

    <!-- TOP STATS -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-card-line" style="background:var(--accent)"></div>
        <div class="stat-num">${hasSales ? inrShort(totalRevenue) : '—'}</div>
        <div class="stat-label">Total Revenue</div>
        <div class="stat-sub">${hasSales && trend !== null
          ? `<span class="stat-trend ${trend >= 0 ? 'up' : 'down'}">${trend >= 0 ? '↑' : '↓'} ${Math.abs(trend)}%</span> vs last month`
          : 'No sales recorded'}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-line" style="background:var(--blue)"></div>
        <div class="stat-num">${hasSales ? totalUnits.toLocaleString('en-IN') : '—'}</div>
        <div class="stat-label">Units Sold</div>
        <div class="stat-sub">${hasSales ? 'Across all platforms' : 'Add sales to populate'}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-line" style="background:var(--green)"></div>
        <div class="stat-num">${totalSKUs}</div>
        <div class="stat-label">Total SKUs</div>
        <div class="stat-sub">${activeSKUs} active · ${totalSKUs - activeSKUs} inactive</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-line" style="background:var(--purple)"></div>
        <div class="stat-num">${PLATFORMS.filter(p => p.status === 'live').length}<small>/${PLATFORMS.length}</small></div>
        <div class="stat-label">Live Platforms</div>
        <div class="stat-sub">${PLATFORMS.filter(p => p.status === 'pending').length} pending setup</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-line" style="background:var(--gold)"></div>
        <div class="stat-num">${aspAvg !== null ? inrShort(aspAvg) : '—'}</div>
        <div class="stat-label">Avg ASP</div>
        <div class="stat-sub">${productsWithASP.length}/${totalSKUs} priced</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-line" style="background:var(--teal)"></div>
        <div class="stat-num">${avgMarginPct !== null ? avgMarginPct + '%' : '—'}</div>
        <div class="stat-label">Avg Margin</div>
        <div class="stat-sub">${productsWithCogs.length}/${totalSKUs} have cogs+asp</div>
      </div>
    </div>

    <!-- TOP PRODUCTS + PLATFORMS -->
    ${hasSales ? `
    <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px; margin-bottom: 28px;">
      <div>
        <div class="sec-title">
          Top Sellers
          <div class="sec-title-line"></div>
          <span class="right">By recorded revenue</span>
        </div>
        <div class="tbl-wrap">
          <table class="tbl">
            <thead>
              <tr>
                <th style="width:40px">#</th>
                <th>Product</th>
                <th>Cat</th>
                <th>Units</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              ${topProducts.length ? topProducts.map((p, i) => `
                <tr class="clickable" onclick="openProductDrawer(${p.id})">
                  <td class="sku-mono">${i + 1}</td>
                  <td>
                    <div style="font-weight: 500; font-size: 13px;">${shortName(p.name, 38)}</div>
                    <div class="sku-mono">${p.sku_code || '#'+p.id}</div>
                  </td>
                  <td>${categoryBadge(p.cat)}</td>
                  <td class="sku-mono">${p.units}</td>
                  <td><strong style="font-family:var(--font-mono);">${inrShort(p.revenue)}</strong></td>
                </tr>
              `).join('') : '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--muted);">No revenue recorded yet</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div class="sec-title">
          Platform Revenue
          <div class="sec-title-line"></div>
        </div>
        <div class="card" style="padding: 18px;">
          ${(() => {
            const visiblePlatforms = platformBreakdown.filter(p => p.revenue > 0);
            if (!visiblePlatforms.length) return '<div style="text-align:center;padding:20px;color:var(--muted);font-size:12px;">No platform sales yet</div>';
            const max = Math.max(...visiblePlatforms.map(p => p.revenue));
            return visiblePlatforms.map(p => `
              <div onclick="showPage('platform-detail','${p.id}')" style="cursor:pointer;padding:8px 0;border-bottom:1px solid var(--rule-soft);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                  <span style="display:flex;align-items:center;gap:8px;font-size:12px;">
                    <span style="width:22px;height:22px;background:${p.bg};color:${p.color};display:inline-flex;align-items:center;justify-content:center;border-radius:4px;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:-0.04em;">${p.short}</span>
                    ${p.name}
                  </span>
                  <strong style="font-family:var(--font-mono);font-size:12px;">${inrShort(p.revenue)}</strong>
                </div>
                <div class="bar-chart-track" style="height:5px;">
                  <div class="bar-chart-fill" style="width:${p.revenue/max*100}%;background:${p.color};"></div>
                </div>
              </div>
            `).join('');
          })()}
        </div>
      </div>
    </div>
    ` : ''}

    <!-- CATEGORY GRID -->
    <div class="sec-title">Categories <div class="sec-title-line"></div></div>
    <div class="prod-grid" style="grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); margin-bottom: 28px;">
      ${CATEGORIES.filter(c => catCounts[c.id]).map(cat => `
        <div class="card" style="padding: 16px; cursor: pointer; position: relative; overflow: hidden;" onclick="showPage('catalogue'); setTimeout(()=>{const el=document.getElementById('cat-filter');if(el){el.value='${cat.id}';el.dispatchEvent(new Event('change'));}}, 80);">
          <div style="position:absolute;top:0;left:0;bottom:0;width:3px;background:${cat.color};"></div>
          <div style="font-weight:500;font-size:13px;margin-bottom:4px;padding-left:8px;">${cat.name}</div>
          <div style="display:flex;justify-content:space-between;align-items:flex-end;padding-left:8px;">
            <span style="font-family:var(--font-display);font-size:24px;font-weight:800;color:${cat.color};">${catCounts[cat.id]}</span>
            <span style="font-family:var(--font-mono);font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em;">SKUs</span>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- BRAND OVERVIEW -->
    <div class="sec-title">Sub-brands <div class="sec-title-line"></div></div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px;">
      ${Object.entries(BRANDS).map(([key, b]) => `
        <div class="card" style="padding:18px;cursor:pointer;border-top:3px solid ${b.color};" onclick="showPage('catalogue'); setTimeout(()=>{const el=document.getElementById('brand-filter');if(el){el.value='${key}';el.dispatchEvent(new Event('change'));}}, 80);">
          <div style="font-family:var(--font-display);font-size:18px;font-weight:800;letter-spacing:-0.02em;margin-bottom:2px;">${b.name}</div>
          <div style="font-size:11px;color:var(--muted);font-family:var(--font-mono);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:14px;">${b.tagline}</div>
          <div style="display:flex;justify-content:space-between;align-items:flex-end;">
            <div>
              <div style="font-family:var(--font-display);font-size:28px;font-weight:800;color:${b.color};line-height:1;">${brandData[key].count}</div>
              <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.12em;font-family:var(--font-mono);">SKUs</div>
            </div>
            <div style="text-align:right;">
              <div style="font-family:var(--font-mono);font-size:14px;font-weight:500;">${brandData[key].revenue > 0 ? inrShort(brandData[key].revenue) : '—'}</div>
              <div style="font-size:10px;color:var(--muted);">revenue</div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- QUICK ACTIONS -->
    <div class="sec-title">Quick Actions <div class="sec-title-line"></div></div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
      <button class="card" style="padding:18px;cursor:pointer;text-align:left;border:1px solid var(--rule);" onclick="showPage('upload')">
        <div style="font-family:var(--font-display);font-size:14px;font-weight:700;margin-bottom:6px;">Add Sales Entry +</div>
        <div style="font-size:11px;color:var(--muted);">Manual or CSV upload</div>
      </button>
      <button class="card" style="padding:18px;cursor:pointer;text-align:left;border:1px solid var(--rule);" onclick="entryState={mode:'inventory',csvType:'sales',csvParsed:null,invSearch:'',imgSearch:'',imgFilter:'all'}; showPage('upload')">
        <div style="font-family:var(--font-display);font-size:14px;font-weight:700;margin-bottom:6px;">Update Inventory →</div>
        <div style="font-size:11px;color:var(--muted);">FBA, Blinkit, Flipkart, warehouse splits</div>
      </button>
      <button class="card" style="padding:18px;cursor:pointer;text-align:left;border:1px solid var(--rule);" onclick="entryState={mode:'images',csvType:'sales',csvParsed:null,invSearch:'',imgSearch:'',imgFilter:'all'}; showPage('upload')">
        <div style="font-family:var(--font-display);font-size:14px;font-weight:700;margin-bottom:6px;">Add Product Images 🖼</div>
        <div style="font-size:11px;color:var(--muted);">Paste image URLs to render real photos</div>
      </button>
      <button class="card" style="padding:18px;cursor:pointer;text-align:left;border:1px solid var(--rule);" onclick="showPage('add-product')">
        <div style="font-family:var(--font-display);font-size:14px;font-weight:700;margin-bottom:6px;">Add Product +</div>
        <div style="font-size:11px;color:var(--muted);">Register a new SKU</div>
      </button>
    </div>
  `;
});

function renderDashboard() { showPage('dashboard'); }

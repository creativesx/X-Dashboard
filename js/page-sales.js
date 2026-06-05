// ═══════════════════════════════════════════
//  SALES ANALYSIS PAGE
// ═══════════════════════════════════════════

let salesState = {
  platform: 'all',
  category: 'all',
  monthRange: 'all',
  productFocus: null
};

registerPage('sales', (param) => {
  if (param) salesState.productFocus = param;
  renderSalesPage();
});

function renderSalesPage() {
  // Hard empty state — no sales data at all
  if (!SALES_DATA.length) {
    document.getElementById('page-sales').innerHTML = `
      <div class="page-header">
        <div class="page-header-left">
          <div class="page-eyebrow">Analytics</div>
          <div class="page-title">Sales Analytics</div>
          <div class="page-desc">Multi-platform revenue, trends, and product-level insights.</div>
        </div>
      </div>
      <div class="card" style="padding: 60px 40px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
        <div style="font-family: var(--font-display); font-size: 22px; font-weight: 700; margin-bottom: 8px;">No Sales Data Yet</div>
        <div style="font-size: 14px; color: var(--muted); max-width: 480px; margin: 0 auto 24px;">
          Add sales entries (manual or CSV upload) and this page will fill with monthly trends, platform splits, and top performers.
        </div>
        <button class="btn accent" onclick="showPage('upload')">+ Add First Sales Entry</button>
      </div>
    `;
    return;
  }

  // Compute aggregates
  const filtered = SALES_DATA.filter(s => {
    if (salesState.platform !== 'all' && s.plat !== salesState.platform) return false;
    if (salesState.monthRange !== 'all' && s.month !== parseInt(salesState.monthRange)) return false;
    if (salesState.category !== 'all') {
      const p = PRODUCTS.find(x => x.id === s.pid);
      if (!p || p.cat !== salesState.category) return false;
    }
    if (salesState.productFocus && s.pid !== salesState.productFocus) return false;
    return true;
  });

  const totalRev = filtered.reduce((s, x) => s + x.revenue, 0);
  const totalUnits = filtered.reduce((s, x) => s + x.units, 0);
  const avgOrderVal = totalUnits ? totalRev / totalUnits : 0;
  const uniqueProducts = new Set(filtered.map(s => s.pid)).size;

  // Monthly trend
  const monthly = [0, 1, 2, 3, 4, 5].map(m => {
    const month = filtered.filter(s => s.month === m);
    return {
      m,
      revenue: month.reduce((s, x) => s + x.revenue, 0),
      units: month.reduce((s, x) => s + x.units, 0),
    };
  });

  const focusedProduct = salesState.productFocus ? PRODUCTS.find(p => p.id === salesState.productFocus) : null;

  // Platform breakdown for current filter (excluding platform filter)
  const platBreakdown = PLATFORMS.map(pl => {
    const f = SALES_DATA.filter(s => {
      if (s.plat !== pl.id) return false;
      if (salesState.monthRange !== 'all' && s.month !== parseInt(salesState.monthRange)) return false;
      if (salesState.category !== 'all') {
        const p = PRODUCTS.find(x => x.id === s.pid);
        if (!p || p.cat !== salesState.category) return false;
      }
      if (salesState.productFocus && s.pid !== salesState.productFocus) return false;
      return true;
    });
    return {
      ...pl,
      revenue: f.reduce((s, x) => s + x.revenue, 0),
      units: f.reduce((s, x) => s + x.units, 0)
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // Top products in current filter
  const productAgg = {};
  filtered.forEach(s => {
    if (!productAgg[s.pid]) productAgg[s.pid] = { revenue: 0, units: 0 };
    productAgg[s.pid].revenue += s.revenue;
    productAgg[s.pid].units += s.units;
  });
  const topProducts = Object.entries(productAgg)
    .map(([pid, data]) => ({ ...PRODUCTS.find(p => p.id === parseInt(pid)), ...data }))
    .filter(p => p.id)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 15);

  document.getElementById('page-sales').innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-eyebrow">Sales Analytics</div>
        <div class="page-title">${focusedProduct ? shortName(focusedProduct.name, 30) : 'Sales Analysis'}</div>
        <div class="page-desc">${focusedProduct ? `Sales breakdown for ${focusedProduct.name}` : 'Multi-platform revenue and unit analysis with drill-down by category, brand, or product.'}</div>
      </div>
      <div class="page-actions">
        ${focusedProduct ? '<button class="btn ghost" onclick="salesState.productFocus = null; renderSalesPage()">✕ Clear Product Filter</button>' : ''}
        <button class="btn secondary" onclick="exportSalesCSV()">↓ Export CSV</button>
        <button class="btn secondary" onclick="showPage('upload')">↑ Upload Data</button>
      </div>
    </div>

    <!-- FILTERS -->
    <div class="filter-bar">
      <select class="select" onchange="salesState.platform = this.value; renderSalesPage()" style="min-width:160px;">
        <option value="all" ${salesState.platform === 'all' ? 'selected' : ''}>All Platforms</option>
        ${PLATFORMS.filter(p => p.status === 'live' || p.status === 'pending').map(p => `<option value="${p.id}" ${salesState.platform === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
      </select>
      <select class="select" onchange="salesState.category = this.value; renderSalesPage()" style="min-width:160px;">
        <option value="all" ${salesState.category === 'all' ? 'selected' : ''}>All Categories</option>
        ${CATEGORIES.map(c => `<option value="${c.id}" ${salesState.category === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
      </select>
      <select class="select" onchange="salesState.monthRange = this.value; renderSalesPage()" style="min-width:140px;">
        <option value="all" ${salesState.monthRange === 'all' ? 'selected' : ''}>Last 6 Months</option>
        <option value="0" ${salesState.monthRange === '0' ? 'selected' : ''}>Last 30 Days</option>
        <option value="1" ${salesState.monthRange === '1' ? 'selected' : ''}>30-60 Days Ago</option>
        <option value="2" ${salesState.monthRange === '2' ? 'selected' : ''}>60-90 Days Ago</option>
      </select>
    </div>

    <!-- TOP STATS -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-card-line" style="background:var(--accent)"></div>
        <div class="stat-num">${inrShort(totalRev)}</div>
        <div class="stat-label">Total Revenue</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-line" style="background:var(--blue)"></div>
        <div class="stat-num">${totalUnits.toLocaleString('en-IN')}</div>
        <div class="stat-label">Units Sold</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-line" style="background:var(--green)"></div>
        <div class="stat-num">${inrShort(avgOrderVal)}</div>
        <div class="stat-label">Avg Order Value</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-line" style="background:var(--purple)"></div>
        <div class="stat-num">${uniqueProducts}</div>
        <div class="stat-label">Active SKUs</div>
        <div class="stat-sub">Products selling in this period</div>
      </div>
    </div>

    <!-- MONTHLY TREND CHART -->
    <div class="sec-title">Monthly Trend <div class="sec-title-line"></div></div>
    <div class="card" style="margin-bottom: 28px;">
      ${(() => {
        const max = Math.max(...monthly.map(m => m.revenue));
        const labels = ['This Month', '-1M', '-2M', '-3M', '-4M', '-5M'];
        return `
          <div style="display: flex; align-items: flex-end; gap: 12px; height: 180px; padding: 0 8px;">
            ${monthly.map((m, i) => `
              <div style="flex:1;display:flex;flex-direction:column;align-items:center;">
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--muted);margin-bottom:6px;">${inrShort(m.revenue)}</div>
                <div style="width:100%;height:${max ? m.revenue/max*140 : 0}px;background:linear-gradient(to top, var(--accent) 0%, #FF7A4D 100%);border-radius:3px 3px 0 0;min-height:2px;"></div>
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--muted);margin-top:8px;text-transform:uppercase;letter-spacing:0.1em;">${labels[i]}</div>
                <div style="font-size:10px;color:var(--muted-soft);">${m.units} u</div>
              </div>
            `).reverse().join('')}
          </div>
        `;
      })()}
    </div>

    <!-- TWO COL: PLATFORM + TOP PRODUCTS -->
    <div style="display: grid; grid-template-columns: 1fr 1.4fr; gap: 20px; margin-bottom: 28px;">
      <div>
        <div class="sec-title">Platform Split <div class="sec-title-line"></div></div>
        <div class="card" style="padding: 16px;">
          ${(() => {
            const max = Math.max(...platBreakdown.map(p => p.revenue));
            return platBreakdown.filter(p => p.revenue > 0).map(p => `
              <div style="padding: 8px 0; border-bottom: 1px solid var(--rule-soft); cursor: pointer;" onclick="salesState.platform='${p.id}'; renderSalesPage();">
                <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
                  <span style="font-size:13px;display:flex;align-items:center;gap:8px;">
                    <span style="width:20px;height:20px;background:${p.bg};color:${p.color};display:inline-flex;align-items:center;justify-content:center;border-radius:3px;font-family:var(--font-mono);font-size:8px;font-weight:700;">${p.short}</span>
                    ${p.name}
                  </span>
                  <span style="font-family:var(--font-mono);font-size:12px;font-weight:500;">${inrShort(p.revenue)}</span>
                </div>
                <div class="bar-chart-track" style="height:5px;">
                  <div class="bar-chart-fill" style="width:${max ? p.revenue/max*100 : 0}%;background:${p.color};"></div>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:3px;">
                  <span style="font-size:10px;color:var(--muted);">${p.units} units</span>
                  <span style="font-size:10px;color:var(--muted);">${totalRev ? Math.round(p.revenue/totalRev*100) : 0}%</span>
                </div>
              </div>
            `).join('') || '<div style="text-align:center;padding:30px;color:var(--muted);font-size:12px;">No platform data</div>';
          })()}
        </div>
      </div>

      <div>
        <div class="sec-title">Top Products <div class="sec-title-line"></div></div>
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
              ${topProducts.length ? topProducts.map((p, i) => `
                <tr class="clickable" onclick="openProductDrawer(${p.id})">
                  <td class="sku-mono">${i + 1}</td>
                  <td><div style="font-weight:500;">${shortName(p.name, 36)}</div><div class="sku-mono">${p.sku_code || '#'+p.id}</div></td>
                  <td>${categoryBadge(p.cat)}</td>
                  <td class="sku-mono">${p.units}</td>
                  <td><strong style="font-family:var(--font-mono);">${inrShort(p.revenue)}</strong></td>
                </tr>
              `).join('') : '<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--muted);">No data for this filter</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ACTION HINT -->
    <div class="hint-box">
      <div class="hint-icon">i</div>
      <div>
        <strong>Pro tip:</strong> Click any platform or product to drill down further. Upload your real Amazon Seller Central / Blinkit / Flipkart sales reports via <a href="#" onclick="showPage('upload');return false;" style="color:var(--blue);text-decoration:underline;">Upload Data</a> to replace the simulated numbers.
      </div>
    </div>
  `;
}

function exportSalesCSV() {
  const rows = [['SKU', 'Product', 'Category', 'Platform', 'Month', 'Units', 'Revenue']];
  SALES_DATA.forEach(s => {
    const p = PRODUCTS.find(x => x.id === s.pid);
    if (!p) return;
    rows.push([p.id, p.name, p.cat, getPlatform(s.plat).name, s.month, s.units, s.revenue]);
  });
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'shftx-sales-export.csv';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Sales data exported');
}

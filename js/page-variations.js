// ═══════════════════════════════════════════
//  VARIATION MANAGER PAGE
// ═══════════════════════════════════════════

let variationState = { search: '', cat: 'all' };

registerPage('variations', () => {
  document.getElementById('page-variations').innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-eyebrow">Catalogue Operations</div>
        <div class="page-title">Variation Manager</div>
        <div class="page-desc">Group SKUs into parent-child variation families. Merge .com → .in to consolidate review base. Spot stranded children that need a parent.</div>
      </div>
      <div class="page-actions">
        <button class="btn secondary" onclick="showPage('add-product')">+ Add Product</button>
        <button class="btn accent" onclick="exportVariationsCSV()">↓ Export Variations</button>
      </div>
    </div>

    <!-- VARIATION TIPS BANNER -->
    <div class="card" style="padding: 16px 18px; margin-bottom: 20px; background: var(--gold-soft); border-color: var(--gold-line);">
      <div style="font-family: var(--font-display); font-size: 13px; font-weight: 600; color: var(--gold); letter-spacing: 0.04em; margin-bottom: 6px;">VARIATION PLAYBOOK</div>
      <div style="font-size: 12.5px; color: #5A4A1A; line-height: 1.6;">
        <strong>Game of Variation:</strong> Merge .com (high reviews) with .in (low reviews) under the same ASIN to consolidate review base. Then optionally
        <strong>price the high-review variant up</strong> to redirect traffic to the lower-rated one while keeping the social proof. Use only after running review-prediction tools.
      </div>
    </div>

    <!-- FILTERS -->
    <div class="filter-bar">
      <input class="select" id="var-search" placeholder="Search variation family..." style="flex: 1; min-width: 200px;" oninput="variationState.search = this.value; renderVariationFamilies()">
      <select class="select" onchange="variationState.cat = this.value; renderVariationFamilies()" style="min-width:160px;">
        <option value="all">All Categories</option>
        ${CATEGORIES.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
      </select>
    </div>

    <!-- STATS STRIP -->
    <div id="var-stats-strip" class="stat-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 20px;"></div>

    <!-- FAMILIES -->
    <div id="var-families-wrap"></div>
  `;
  renderVariationStats();
  renderVariationFamilies();
});

function getBaseSKU(sku) {
  if (!sku) return null;
  // Strip trailing color/size codes after underscore: _PR, _PK, _BL, _RD, _BK, _WH, _GY, _GR, _GD, _SV, _M, _L, _S, _XL, _X
  return sku.replace(/_(PR|PK|BL|BLU|RD|RED|BK|BLK|WH|WHT|GY|GRY|GR|GRN|GD|SV|GLD|SLV|YL|YLW|OR|PUR|XS|S|M|L|XL|XXL|X|MIN|MAX)(_X)?$/i, '')
            .replace(/_X$/i, '')
            .toLowerCase();
}

function detectVariantTrait(sku, name) {
  const traits = [];
  if (/_PR\b|purple/i.test(sku + ' ' + name)) traits.push({ label: 'Purple', color: '#8C2040' });
  if (/_PK\b|pink/i.test(sku + ' ' + name)) traits.push({ label: 'Pink', color: '#E91E63' });
  if (/_BL\b|_BLU\b|blue/i.test(sku + ' ' + name)) traits.push({ label: 'Blue', color: '#1A4B8C' });
  if (/_RD\b|_RED\b|red/i.test(sku + ' ' + name)) traits.push({ label: 'Red', color: '#C0392B' });
  if (/_BK\b|_BLK\b|black/i.test(sku + ' ' + name)) traits.push({ label: 'Black', color: '#0D0D0D' });
  if (/_WH\b|_WHT\b|white/i.test(sku + ' ' + name)) traits.push({ label: 'White', color: '#999' });
  if (/_GY\b|_GRY\b|gray|grey/i.test(sku + ' ' + name)) traits.push({ label: 'Grey', color: '#6B6B6B' });
  if (/_GR\b|_GRN\b|green/i.test(sku + ' ' + name)) traits.push({ label: 'Green', color: '#1A6B3C' });
  if (/_GD\b|_GLD\b|gold/i.test(sku + ' ' + name)) traits.push({ label: 'Gold', color: '#B8932E' });
  if (/_SV\b|_SLV\b|silver/i.test(sku + ' ' + name)) traits.push({ label: 'Silver', color: '#A0A0A0' });
  // Sizes / lengths
  const m = name.match(/(\d+(\.\d+)?)\s*(m|meter|metre|cm|inch|ft|feet|"|w|watt)/i);
  if (m) traits.push({ label: m[0], color: '#3A3020' });
  return traits;
}

function buildVariationFamilies() {
  const families = {};
  PRODUCTS.forEach(p => {
    const base = getBaseSKU(p.sku_code) || ('id_' + p.id);
    if (!families[base]) {
      families[base] = {
        base,
        products: [],
        cat: p.cat,
        brand: p.brand,
      };
    }
    families[base].products.push(p);
  });

  // Sort: families with > 1 first
  return Object.values(families).sort((a, b) => b.products.length - a.products.length);
}

function renderVariationStats() {
  const fams = buildVariationFamilies();
  const multiFams = fams.filter(f => f.products.length > 1);
  const stranded = fams.filter(f => f.products.length === 1);
  const totalChildren = multiFams.reduce((s, f) => s + f.products.length, 0);

  document.getElementById('var-stats-strip').innerHTML = `
    <div class="stat-card">
      <div class="stat-card-line" style="background: var(--accent);"></div>
      <div class="stat-num">${fams.length}</div>
      <div class="stat-label">Total Families</div>
      <div class="stat-sub">Grouped by base SKU</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-line" style="background: var(--green);"></div>
      <div class="stat-num">${multiFams.length}</div>
      <div class="stat-label">Multi-Variant</div>
      <div class="stat-sub">${totalChildren} child SKUs</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-line" style="background: var(--gold);"></div>
      <div class="stat-num">${stranded.length}</div>
      <div class="stat-label">Single-SKU</div>
      <div class="stat-sub">No siblings yet</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-line" style="background: var(--blue);"></div>
      <div class="stat-num">${PRODUCTS.length}</div>
      <div class="stat-label">Total SKUs</div>
      <div class="stat-sub">Across catalogue</div>
    </div>
  `;
}

function renderVariationFamilies() {
  let fams = buildVariationFamilies();

  if (variationState.cat !== 'all') {
    fams = fams.filter(f => f.cat === variationState.cat);
  }
  if (variationState.search) {
    const q = variationState.search.toLowerCase();
    fams = fams.filter(f => f.products.some(p => (p.name + ' ' + p.sku_code).toLowerCase().includes(q)));
  }

  const wrap = document.getElementById('var-families-wrap');

  if (!fams.length) {
    wrap.innerHTML = `<div class="empty-state"><div style="font-size: 14px; color: var(--muted);">No variation families match.</div></div>`;
    return;
  }

  // Split: multi-variant first, then strandeds
  const multi = fams.filter(f => f.products.length > 1);
  const single = fams.filter(f => f.products.length === 1);

  wrap.innerHTML = `
    ${multi.length ? `
      <div class="sec-title">
        <span>Multi-Variant Families</span>
        <span class="sec-title-line"></span>
        <span class="right">${multi.length} families · ${multi.reduce((s, f) => s + f.products.length, 0)} SKUs</span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 32px;">
        ${multi.map(renderFamilyCard).join('')}
      </div>
    ` : ''}

    ${single.length ? `
      <div class="sec-title">
        <span>Single-SKU Products</span>
        <span class="sec-title-line"></span>
        <span class="right">${single.length} stranded · candidates for new variants</span>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px;">
        ${single.map(f => renderStrandedCard(f.products[0])).join('')}
      </div>
    ` : ''}
  `;
}

function renderFamilyCard(family) {
  const c = getCat(family.cat);
  const brand = getBrand(family.brand);
  const totalUnits = family.products.reduce((s, p) => s + getProductTotalUnits(p.id), 0);
  const totalRev = family.products.reduce((s, p) => s + getProductTotalRevenue(p.id), 0);
  const minPrice = Math.min(...family.products.map(p => p.asp || 0).filter(x => x > 0));
  const maxPrice = Math.max(...family.products.map(p => p.asp || 0));

  return `
    <div class="card" style="padding: 0; overflow: hidden;">
      <!-- FAMILY HEADER -->
      <div style="padding: 16px 20px; border-bottom: 1px solid var(--rule); display: flex; align-items: center; gap: 16px; background: var(--surface-alt);">
        <div style="width: 4px; align-self: stretch; background: ${c.color}; border-radius: 2px;"></div>
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
            <span class="tag" style="background: ${c.color}; color: white; font-size: 9.5px;">${c.name}</span>
            <span class="tag" style="background: ${brand.color}20; color: ${brand.color}; font-size: 9.5px;">${brand.name}</span>
            <span style="font-size: 10.5px; color: var(--muted); font-family: var(--font-mono);">${family.base}</span>
          </div>
          <div style="font-family: var(--font-display); font-size: 16px; font-weight: 600; color: var(--ink);">
            ${family.products[0].name.replace(/\s+(Purple|Pink|Blue|Red|Black|White|Grey|Green|Gold|Silver|\d+\s*(m|cm|w|ft))\s*$/i, '')}
          </div>
        </div>
        <div style="text-align: right; display: flex; gap: 24px;">
          <div>
            <div style="font-size: 9.5px; color: var(--muted); letter-spacing: 0.06em; text-transform: uppercase;">Variants</div>
            <div style="font-family: var(--font-display); font-size: 18px; font-weight: 600;">${family.products.length}</div>
          </div>
          <div>
            <div style="font-size: 9.5px; color: var(--muted); letter-spacing: 0.06em; text-transform: uppercase;">Combined Units</div>
            <div style="font-family: var(--font-display); font-size: 18px; font-weight: 600;">${totalUnits.toLocaleString('en-IN')}</div>
          </div>
          <div>
            <div style="font-size: 9.5px; color: var(--muted); letter-spacing: 0.06em; text-transform: uppercase;">Revenue</div>
            <div style="font-family: var(--font-display); font-size: 18px; font-weight: 600;">${inrShort(totalRev)}</div>
          </div>
          <div>
            <div style="font-size: 9.5px; color: var(--muted); letter-spacing: 0.06em; text-transform: uppercase;">Price Range</div>
            <div style="font-family: var(--font-display); font-size: 18px; font-weight: 600;">${minPrice === maxPrice ? inr(minPrice) : `${inr(minPrice)}–${inr(maxPrice)}`}</div>
          </div>
        </div>
      </div>

      <!-- VARIANTS GRID -->
      <div style="padding: 14px 20px; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px;">
        ${family.products.map(p => {
          const traits = detectVariantTrait(p.sku_code, p.name);
          const units = getProductTotalUnits(p.id);
          const drr = getDRR(p.id);
          const inv = getProductInv(p.id);
          const totalInv = inv ? (inv.fba + inv.blinkit + inv.flipkart + inv.warehouse + inv.transit) : 0;
          return `
            <div onclick="openProductDrawer(${p.id})" style="padding: 12px; border: 1px solid var(--rule); border-radius: 6px; background: white; cursor: pointer; transition: all 0.12s;" onmouseover="this.style.borderColor='var(--ink-mid)'" onmouseout="this.style.borderColor='var(--rule)'">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                ${traits.length ? traits.map(t => `<span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 3px; background: ${t.color}15; color: ${t.color}; font-size: 10px; font-weight: 500;"><span style="width: 7px; height: 7px; border-radius: 50%; background: ${t.color};"></span>${t.label}</span>`).join('') : '<span style="font-size: 10px; color: var(--muted);">Default</span>'}
              </div>
              <div style="font-size: 12px; color: var(--ink); margin-bottom: 8px; line-height: 1.4; height: 32px; overflow: hidden;">${p.name}</div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid var(--rule-soft);">
                <div>
                  <div style="font-family: var(--font-display); font-size: 14px; font-weight: 600;">${inr(p.asp)}</div>
                  <div style="font-size: 9.5px; color: var(--muted); margin-top: 2px;">SKU · <span style="font-family: var(--font-mono);">${p.sku_code || '—'}</span></div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 10px; color: var(--muted);">DRR ${drr ? drr.toFixed(1) : "—"}</div>
                  <div style="font-size: 10px; color: ${(drr && totalInv < drr * 14) ? 'var(--accent)' : 'var(--muted)'}; font-weight: ${(drr && totalInv < drr * 14) ? 600 : 400};">Inv ${totalInv}</div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- FAMILY ACTIONS -->
      <div style="padding: 12px 20px; border-top: 1px solid var(--rule); background: var(--surface-alt); display: flex; gap: 8px; flex-wrap: wrap;">
        <button class="btn sm secondary" onclick="suggestMergeFamily('${family.base}')">⤷ Merge .com → .in</button>
        <button class="btn sm secondary" onclick="runFamilyReviewMath('${family.base}')">★ Review Math</button>
        <button class="btn sm secondary" onclick="suggestPriceManipulation('${family.base}')">⇡ Price Manipulation</button>
        <div style="flex: 1;"></div>
        <button class="btn sm ghost" onclick="showPage('add-product')">+ Add variant</button>
      </div>
    </div>
  `;
}

function renderStrandedCard(p) {
  const c = getCat(p.cat);
  const brand = getBrand(p.brand);
  const drr = getDRR(p.id);
  return `
    <div class="card" style="padding: 14px; display: flex; flex-direction: column; gap: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
        <div style="flex: 1;">
          <div style="display: flex; gap: 6px; margin-bottom: 4px;">
            <span class="tag" style="background: ${c.color}; color: white; font-size: 9px;">${c.name}</span>
            <span class="tag" style="background: ${brand.color}15; color: ${brand.color}; font-size: 9px;">${brand.name}</span>
          </div>
          <div style="font-size: 12.5px; color: var(--ink); line-height: 1.4; font-weight: 500;">${p.name}</div>
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="font-family: var(--font-display); font-size: 14px; font-weight: 600;">${inr(p.asp)}</div>
        <div style="font-size: 10px; color: var(--muted);">DRR ${drr ? drr.toFixed(1) : "—"}</div>
      </div>
      <div style="display: flex; gap: 6px;">
        <button class="btn tiny secondary" style="flex: 1;" onclick="openProductDrawer(${p.id})">View</button>
        <button class="btn tiny accent" style="flex: 1;" onclick="suggestNewVariant(${p.id})">+ Add Variant</button>
      </div>
    </div>
  `;
}

function suggestMergeFamily(base) {
  const family = buildVariationFamilies().find(f => f.base === base);
  if (!family) return;
  showToast(`Merge plan: ${family.products.length} SKUs → consolidate under master ASIN. Coordinate with Saurabh Sir.`, 'info');
}

function runFamilyReviewMath(base) {
  const family = buildVariationFamilies().find(f => f.base === base);
  if (!family) return;
  const totalDRR = family.products.reduce((s, p) => s + (getDRR(p.id) || 0), 0);
  const expectedReviews = totalDRR * 0.10;
  const monthlyReviews = expectedReviews * 30;
  showToast(`Family DRR ${totalDRR.toFixed(1)}/day → ~${expectedReviews.toFixed(1)} reviews/day organic → ~${Math.round(monthlyReviews)} reviews/month at 10% conversion.`, 'info');
}

function suggestPriceManipulation(base) {
  const family = buildVariationFamilies().find(f => f.base === base);
  if (!family || family.products.length < 2) {
    showToast('Need 2+ variants to run price manipulation play.', 'warn');
    return;
  }
  showToast(`Strategy: pick the highest-review variant, raise its price 2-3x to throttle sales while inheriting reviews to the lower-rated sibling. Run review math first.`, 'info');
}

function suggestNewVariant(pid) {
  const p = PRODUCTS.find(x => x.id === pid);
  if (!p) return;
  showToast(`To add a variant to "${p.name}": go to Add Product → use base SKU pattern + new color/size code.`, 'info');
  setTimeout(() => showPage('add-product'), 800);
}

function exportVariationsCSV() {
  const fams = buildVariationFamilies();
  let csv = 'Family Base,Variants Count,Category,Brand,Combined Units,Combined Revenue\n';
  fams.forEach(f => {
    const units = f.products.reduce((s, p) => s + getProductTotalUnits(p.id), 0);
    const rev = f.products.reduce((s, p) => s + getProductTotalRevenue(p.id), 0);
    csv += `"${f.base}",${f.products.length},"${getCat(f.cat).name}","${getBrand(f.brand).name}",${units},${Math.round(rev)}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'shftx-variation-families.csv';
  a.click();
  showToast('Exported variation families to CSV', 'success');
}

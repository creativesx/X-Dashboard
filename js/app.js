// ═══════════════════════════════════════════
//  APP BOOT & GLOBAL HANDLERS
// ═══════════════════════════════════════════

function updateSidebarCounts() {
  const map = {
    'sidebar-count-catalogue': PRODUCTS.length,
    'sidebar-count-mapping': PRODUCTS.length,
    'sidebar-count-platforms': PLATFORMS.filter(p => p.status === 'live').length,
    'sidebar-count-inventory': INVENTORY_DATA.filter(i => {
      const drr = getDRR(i.pid);
      if (!drr || drr <= 0) return false;
      const total = (i.amazon || 0) + (i.blinkit || 0) + (i.flipkart || 0) + (i.warehouse || 0) + (i.in_transit || 0);
      return total < drr * 14;
    }).length,
    'sidebar-count-variations': (() => {
      const set = new Set();
      PRODUCTS.forEach(p => set.add(getBaseSKU(p.sku_code) || ('id_' + p.id)));
      return set.size;
    })(),
  };
  Object.entries(map).forEach(([k, v]) => {
    const el = document.getElementById(k);
    if (el) el.textContent = v;
  });
}

function updateNavStats() {
  const totalRev = SALES_DATA.reduce((s, x) => s + x.revenue, 0);
  const totalUnits = SALES_DATA.reduce((s, x) => s + x.units, 0);
  document.getElementById('nav-stat-skus').innerHTML = `<strong>${PRODUCTS.length}</strong> SKUs`;
  document.getElementById('nav-stat-rev').innerHTML = `<strong>${inrShort(totalRev)}</strong> 6mo Rev`;
  document.getElementById('nav-stat-units').innerHTML = `<strong>${totalUnits.toLocaleString('en-IN')}</strong> units`;
}

function bindGlobalEvents() {
  // Global search
  const searchEl = document.getElementById('nav-search-input');
  if (searchEl) {
    let timer;
    searchEl.addEventListener('input', (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => handleGlobalSearch(e.target.value), 250);
    });
  }

  // Drawer close on overlay click
  const overlay = document.getElementById('drawer-overlay');
  if (overlay) {
    overlay.addEventListener('click', closeDrawer);
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // ESC closes drawer
    if (e.key === 'Escape' && drawerOpen) {
      closeDrawer();
    }
    // Cmd/Ctrl+K focuses search
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      const s = document.getElementById('nav-search-input');
      if (s) { s.focus(); s.select(); }
    }
    // Cmd/Ctrl+/ opens upload
    if ((e.metaKey || e.ctrlKey) && e.key === '/') {
      e.preventDefault();
      showPage('upload');
    }
  });
}

async function bootApp() {
  // Load saved sales/inventory/product overrides from window.storage FIRST
  await loadSavedData();

  // Top nav stats
  updateNavStats();
  // Sidebar count badges
  updateSidebarCounts();
  // Global handlers
  bindGlobalEvents();
  // Initial page
  showPage('dashboard');

  console.log('%cSHFTX Master Dashboard', 'font: 700 16px Syne, sans-serif; color: #FF3B00;');
  console.log('%c' + PRODUCTS.length + ' SKUs · ' + SALES_DATA.length + ' sales rows · ' + INVENTORY_DATA.length + ' inventory rows', 'color: #6B6B6B; font: 12px monospace;');
  console.log('Shortcuts: Cmd/Ctrl+K = Search · Cmd/Ctrl+/ = Upload · ESC = Close drawer');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootApp);
} else {
  bootApp();
}

// ═══════════════════════════════════════════
//  CONSTANTS & HELPERS
// ═══════════════════════════════════════════

const CATEGORIES = [
  { id: 'CABLE', name: 'Cables', color: '#1E3A5F' },
  { id: 'HDMI CABLE', name: 'HDMI Cables', color: '#2B4F7A' },
  { id: 'CHARGER', name: 'Chargers', color: '#2D5A27' },
  { id: 'CHR+CBL', name: 'Charger Combos', color: '#4A2060' },
  { id: 'CAR CHARGER', name: 'Car Chargers', color: '#7A3000' },
  { id: 'REMOTE', name: 'TV Remotes', color: '#1A3A3A' },
  { id: 'EXTESNION BOARD', name: 'Extension Boards', color: '#2A4A2A' },
  { id: 'MASSAGER', name: 'Massagers', color: '#8C2040' },
  { id: 'CONNECTOR', name: 'Connectors', color: '#4A3A00' },
  { id: 'WIFI UPS', name: 'WiFi UPS', color: '#3A3020' },
  { id: 'PROJETCOR', name: 'Projector', color: '#3A3020' },
];

const PLATFORMS = [
  { id: 'amazon-in', name: 'Amazon India', short: 'AMZ.IN', type: 'Marketplace', color: '#FF9900', bg: '#FFF6E5', url: 'https://www.amazon.in', status: 'live' },
  { id: 'amazon-com', name: 'Amazon Global', short: 'AMZ.COM', type: 'Marketplace', color: '#1B1464', bg: '#EAE8FA', url: 'https://www.amazon.com', status: 'live' },
  { id: 'flipkart', name: 'Flipkart', short: 'FK', type: 'Marketplace', color: '#2874F0', bg: '#E5EFFE', url: 'https://www.flipkart.com', status: 'live' },
  { id: 'blinkit', name: 'Blinkit', short: 'BL', type: 'Q-Commerce', color: '#F8C400', bg: '#FFF9E5', url: 'https://blinkit.com', status: 'live' },
  { id: 'zepto', name: 'Zepto', short: 'ZP', type: 'Q-Commerce', color: '#7C3AED', bg: '#F0E8FE', url: 'https://www.zeptonow.com', status: 'pending' },
  { id: 'instamart', name: 'Swiggy Instamart', short: 'IM', type: 'Q-Commerce', color: '#FC8019', bg: '#FFF1E5', url: 'https://www.swiggy.com/instamart', status: 'pending' },
  { id: 'bigbasket', name: 'BigBasket', short: 'BB', type: 'Grocery', color: '#84C225', bg: '#F1FAE5', url: 'https://www.bigbasket.com', status: 'plan' },
  { id: 'meesho', name: 'Meesho', short: 'MS', type: 'Social Commerce', color: '#F43397', bg: '#FEE5F1', url: 'https://www.meesho.com', status: 'plan' },
  { id: 'jiomart', name: 'JioMart', short: 'JM', type: 'Marketplace', color: '#0070BA', bg: '#E5F1FB', url: 'https://www.jiomart.com', status: 'plan' },
  { id: 'snapdeal', name: 'Snapdeal', short: 'SD', type: 'Marketplace', color: '#E40000', bg: '#FEE5E5', url: 'https://www.snapdeal.com', status: 'plan' },
];

const BRANDS = {
  ailkin: { name: 'Ailkin', color: '#1E3A5F', tagline: 'Charging & Cables' },
  qibox: { name: 'QIBOX', color: '#8C2040', tagline: 'Personal Massagers' },
  homemo: { name: 'Homemo', color: '#1A3A3A', tagline: 'Smart TV Remotes' },
  private: { name: 'Private Label', color: '#3A3020', tagline: 'Misc Accessories' },
};

// ═════════ HELPERS ═════════
function inr(n) {
  if (!n || isNaN(n)) return '—';
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

function inrShort(n) {
  if (!n || isNaN(n)) return '—';
  if (n >= 10000000) return '₹' + (n/10000000).toFixed(1) + 'Cr';
  if (n >= 100000) return '₹' + (n/100000).toFixed(1) + 'L';
  if (n >= 1000) return '₹' + (n/1000).toFixed(1) + 'K';
  return '₹' + Math.round(n);
}

function getCat(id) { return CATEGORIES.find(c => c.id === id) || { color: '#3A3020', name: id }; }
function getCatColor(id) { return getCat(id).color; }
function getCatName(id) { return getCat(id).name; }

function getPlatform(id) { return PLATFORMS.find(p => p.id === id); }

function getBrand(id) { return BRANDS[id] || BRANDS.private; }

function shortName(name, len = 36) {
  return name.length > len ? name.slice(0, len) + '…' : name;
}

function statusBadge(status) {
  const s = String(status || '').toLowerCase();
  return `<span class="status-pill ${s} dot">${s}</span>`;
}

function categoryBadge(cat) {
  const c = getCat(cat);
  return `<span class="cat-badge" style="background:${c.color}">${c.name}</span>`;
}

// initials for image placeholder
function productInitials(name, cat) {
  const c = getCat(cat);
  const words = name.replace(/[^A-Za-z0-9 ]/g,'').split(' ').filter(Boolean);
  let initial = '';
  if (words.length === 1) initial = words[0].slice(0, 2).toUpperCase();
  else initial = (words[0][0] + (words[1] ? words[1][0] : '')).toUpperCase();
  return { initial, color: c.color, label: c.name };
}

// product image — uses real image URL if user has set one, else initials placeholder
function productImage(p) {
  const { initial, color, label } = productInitials(p.name, p.cat);
  const drive = p.drive ? `<a href="${p.drive}" target="_blank" onclick="event.stopPropagation()" style="position:absolute;bottom:6px;right:8px;font-family:var(--font-mono);font-size:9px;color:${color};background:var(--white);padding:2px 6px;border-radius:3px;border:1px solid var(--rule);text-decoration:none;letter-spacing:0.05em;z-index:2;">DRIVE ↗</a>` : '';

  if (p.img) {
    return `
      <div class="prod-img-wrap" style="background:#f5f3ee;">
        <div class="prod-img-cat-bar" style="--c:${color}"></div>
        <img src="${p.img}" alt="${p.name.replace(/"/g,'&quot;')}" loading="lazy" style="width:100%;height:100%;object-fit:contain;display:block;background:#fff;" onerror="this.parentElement.innerHTML += '<div class=&quot;prod-img-placeholder&quot; style=&quot;color:${color};position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#f5f3ee;&quot;>${initial}<small>${label}</small></div>'; this.style.display='none';">
        <span class="prod-img-status">${statusBadge(p.status)}</span>
        ${drive}
      </div>
    `;
  }

  return `
    <div class="prod-img-wrap">
      <div class="prod-img-cat-bar" style="--c:${color}"></div>
      <div class="prod-img-placeholder" style="color:${color}">
        ${initial}
        <small>${label}</small>
      </div>
      <span class="prod-img-status">${statusBadge(p.status)}</span>
      ${drive}
    </div>
  `;
}

// Sales aggregations
function getProductSales(pid, monthFilter = null) {
  return SALES_DATA.filter(s => s.pid === pid && (monthFilter === null || s.month === monthFilter));
}
function getProductTotalUnits(pid) {
  return SALES_DATA.filter(s => s.pid === pid).reduce((sum, s) => sum + s.units, 0);
}
function getProductTotalRevenue(pid) {
  return SALES_DATA.filter(s => s.pid === pid).reduce((sum, s) => sum + s.revenue, 0);
}
function getPlatformTotalRevenue(plat, monthFilter = null) {
  return SALES_DATA.filter(s => s.plat === plat && (monthFilter === null || s.month === monthFilter)).reduce((sum, s) => sum + s.revenue, 0);
}
function getPlatformTotalUnits(plat, monthFilter = null) {
  return SALES_DATA.filter(s => s.plat === plat && (monthFilter === null || s.month === monthFilter)).reduce((sum, s) => sum + s.units, 0);
}
function getPlatformProductCount(plat) {
  return new Set(SALES_DATA.filter(s => s.plat === plat).map(s => s.pid)).size;
}

// Inventory helpers
function getProductInv(pid) {
  return INVENTORY_DATA.find(i => i.pid === pid) || { amazon: 0, blinkit: 0, flipkart: 0, warehouse: 0, in_transit: 0 };
}
function getInvTotal(inv) {
  return (inv.amazon || 0) + (inv.blinkit || 0) + (inv.flipkart || 0) + (inv.warehouse || 0) + (inv.in_transit || 0);
}

// DRR estimate — uses the most recent month of sales data the user has entered
// Returns null if no sales data exists for this product (don't fake a value)
function getDRR(pid) {
  const productSales = SALES_DATA.filter(s => s.pid === pid);
  if (!productSales.length) return null;
  // Find the most recent month present
  const latestMonth = Math.max(...productSales.map(s => s.month));
  const recentUnits = productSales.filter(s => s.month === latestMonth).reduce((sum, s) => sum + s.units, 0);
  return Math.round(recentUnits / 30 * 10) / 10;
}

// Has any sales data been recorded for this product?
function hasSalesData(pid) {
  return SALES_DATA.some(s => s.pid === pid);
}
function hasInventoryData(pid) {
  return INVENTORY_DATA.some(i => i.pid === pid);
}
function hasPricing(p) {
  return p && p.cogs > 0 && p.asp > 0;
}

// Margin
function calcMargin(p) {
  if (!p.cogs || !p.asp) return null;
  return Math.round((p.asp - p.cogs) / p.asp * 100);
}

// Toast
function showToast(msg, success = true) {
  const t = document.getElementById('toast');
  t.innerHTML = `<span class="toast-icon">${success ? '✓' : '!'}</span> ${msg}`;
  t.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// Drive link parser
function driveImageEmbed(driveUrl) {
  if (!driveUrl) return null;
  const m = driveUrl.match(/folders\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

// Storage wrapper
async function saveData(key, value) {
  try {
    if (window.storage) {
      await window.storage.set(key, JSON.stringify(value));
    }
  } catch (e) { console.warn('Save failed', e); }
}
async function loadData(key) {
  try {
    if (window.storage) {
      const r = await window.storage.get(key);
      return r ? JSON.parse(r.value) : null;
    }
  } catch (e) { return null; }
  return null;
}

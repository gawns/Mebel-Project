/**
 * Ine Mebel Jepara - Main Script
 * Data: Postgres-backed product store (API Flask)
 * Handles: Intro, Navbar, Mobile menu, Product rendering,
 *          Catalog filters/sort/load-more, Detail page,
 *          Floating WhatsApp FAB, Wishlist
 */

'use strict';

/* ===============================================================
   API - SUMBER DATA (Postgres via Flask)
   =============================================================== */
const API_BASE = 'api';
const PRODUCT_CATEGORIES = ['kursi', 'meja', 'sofa', 'lemari', 'aksesoris', 'lainnya'];

let _productCache   = [];
let _productsLoaded = false;

async function loadProducts(force = false) {
  if (_productsLoaded && !force) return _productCache;

  try {
    const res  = await fetch(`${API_BASE}/products`, { headers: { Accept: 'application/json' } });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Gagal memuat produk');
    _productCache   = Array.isArray(data.products) ? data.products : [];
    _productsLoaded = true;
  } catch (err) {
    console.error('Gagal memuat produk dari server:', err);
    _productCache   = [];
    _productsLoaded = false;
  }
  return _productCache;
}

function getProducts() {
  return Array.isArray(_productCache) ? _productCache : [];
}

function getCategoryCounts(products = getProducts()) {
  return PRODUCT_CATEGORIES.reduce((counts, category) => {
    counts[category] = products.filter(p => p.category === category).length;
    return counts;
  }, { semua: products.length });
}

function syncProductCounts() {
  const counts = getCategoryCounts();
  document.querySelectorAll('.cat-card__count').forEach((el) => {
    const category = el.closest('.cat-card')?.dataset.category;
    el.textContent = String(category ? (counts[category] ?? 0) : counts.semua);
  });
  document.querySelectorAll('.filter-count').forEach((el) => {
    const filter = el.closest('.sidebar-filter-btn')?.dataset.filter;
    if (!filter) return;
    el.textContent = String(filter === 'semua' ? counts.semua : (counts[filter] ?? 0));
  });
}

/* ===============================================================
   HELPERS
   =============================================================== */
function formatRupiah(num) {
  return 'Rp\u00A0' + Number(num).toLocaleString('id-ID');
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  return String(str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function detailUrl(product) {
  if (product && product.sku) return `detail.html?sku=${encodeURIComponent(product.sku)}`;
  return `detail.html?id=${product ? product.id : ''}`;
}

function createProductCard(product) {
  const card = document.createElement('article');
  card.className = 'product-card';
  card.dataset.category = product.category;
  card.dataset.status = product.status || 'aktif';
  card.dataset.productId = String(product.id);

  const catLabel = product.category.charAt(0).toUpperCase() + product.category.slice(1);
  const isPreorder = product.availability === 'preorder' || product.preorder;
  const discount = product.discountPrice && product.discountPrice < product.price;
  const displayPrice = discount ? product.discountPrice : product.price;
  const hasPrice = displayPrice != null && displayPrice > 0;
  const stock = product.stock ?? null;
  const stockOut = stock === 0;
  const href = detailUrl(product);

  // Badge hanya untuk info yang berguna bagi pembeli.
  // Status draft/nonaktif adalah urusan admin, tidak ditampilkan ke publik.
  let badges = '';
  // Badge hanya kalau harganya ada — kalau kosong, link "Pre Order ke WhatsApp"
  // sudah menjelaskan statusnya, badge jadi dobel.
  if (isPreorder && hasPrice) badges += `<span class="product-badge product-badge--preorder">Pre Order</span>`;
  if (discount)    badges += `<span class="product-badge product-badge--discount">Hemat ${Math.round((1 - product.discountPrice / product.price) * 100)}%</span>`;
  if (stockOut)    badges += `<span class="product-badge product-badge--out">Habis</span>`;

  const waText = encodeURIComponent(
    isPreorder && !hasPrice
      ? `Halo Ine Mebel Jepara, saya mau pre order ${product.name}${product.sku ? ` (${product.sku})` : ''}. Mohon info harga dan estimasi pengerjaan.`
      : `Halo Ine Mebel Jepara, saya mau pesan ${product.name}${product.sku ? ` (${product.sku})` : ''}. Apakah stoknya tersedia?`
  );
  const waHref = `https://wa.me/6285281587738?text=${waText}`;

  // Tampilan harga: jika null/kosong → Pre Order ke WhatsApp
  const priceHtml = hasPrice
    ? `<span class="product-card__price">${formatRupiah(displayPrice)}</span>
       ${discount ? `<span class="product-card__price-original">${formatRupiah(product.price)}</span>` : ''}`
    : `<a class="product-card__preorder-link" href="${waHref}" target="_blank" rel="noopener noreferrer"
          aria-label="Pre Order ${escapeAttr(product.name)} via WhatsApp">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
        Pre Order ke WhatsApp
      </a>`;

  card.innerHTML = `
    <a href="${href}" class="product-card__img-wrap" tabindex="-1" aria-hidden="true">
      ${badges ? `<div class="product-card__badges">${badges}</div>` : ''}
      <img src="${escapeAttr(product.img)}" alt="${escapeAttr(product.imgAlt || product.name)}"
        width="600" height="450" loading="lazy" />
    </a>
    <div class="product-card__body">
      <p class="product-card__cat">${escapeHTML(catLabel)}${product.sku ? ` - ${escapeHTML(product.sku)}` : ''}</p>
      <h3 class="product-card__name">
        <a href="${href}">${escapeHTML(product.name)}</a>
      </h3>
      <p class="product-card__desc">${escapeHTML(product.desc)}</p>
      <div class="product-card__footer">
        <div>
          ${priceHtml}
        </div>
        <button class="wishlist-icon-btn" aria-label="Simpan ${escapeAttr(product.name)} ke wishlist" aria-pressed="false">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
      </div>
      <a class="card-order-btn" href="${waHref}" target="_blank" rel="noopener noreferrer"
         aria-label="Pesan ${escapeAttr(product.name)} lewat WhatsApp">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
        ${stockOut ? 'Tanya stok' : (isPreorder ? 'Pre Order' : 'Pesan')}
      </a>
      ${stock !== null && stock > 0 && stock < 10 ? `<p class="product-card__stock product-card__stock--low">Tersisa ${stock} unit</p>` : ''}
    </div>
  `;

  const wishlistBtn = card.querySelector('.wishlist-icon-btn');
  syncWishlistBtnState(wishlistBtn, product.id);
  wishlistBtn.addEventListener('click', () => {
    toggleWishlist(product.id);
    syncWishlistBtnState(wishlistBtn, product.id);
  });

  return card;
}

/* ===============================================================
   PELACAKAN STATISTIK (kunjungan, lihat produk, favorit)
   =============================================================== */
const VISITOR_KEY = 'imj_visitor_id_v1';

function getVisitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = 'v-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch { return 'anon'; }
}

// Kirim statistik dengan cara "fire and forget" (tidak mengganggu UX).
function sendTrack(path, payload) {
  try {
    fetch(`${API_BASE}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch { /* abaikan */ }
}

function trackPageView(page) {
  sendTrack('track/view', { visitorId: getVisitorId(), page: page || 'site' });
}

function trackProductView(productId) {
  if (!productId) return;
  sendTrack('track/product', { productId: Number(productId) });
}

function trackFavorite(productId, action) {
  if (!productId) return;
  sendTrack('track/favorite', { productId: Number(productId), action: action || 'add' });
}

/* ===============================================================
   WISHLIST - per device (localStorage)
   =============================================================== */
const WISHLIST_KEY = 'jn_wishlist_v1';

function getWishlist() {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function saveWishlist(ids) {
  try { localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids)); } catch {}
}

function isWishlisted(id) { return getWishlist().includes(Number(id)); }

function toggleWishlist(id) {
  const idNum = Number(id);
  let list = getWishlist();
  const removing = list.includes(idNum);
  if (removing) list = list.filter(x => x !== idNum);
  else list.push(idNum);
  saveWishlist(list);
  trackFavorite(idNum, removing ? 'remove' : 'add');
  refreshWishlistUI();
}

function removeFromWishlist(id) {
  saveWishlist(getWishlist().filter(x => x !== Number(id)));
  trackFavorite(Number(id), 'remove');
  refreshWishlistUI();
}

function clearWishlist() {
  saveWishlist([]);
  refreshWishlistUI();
}

function syncWishlistBtnState(btn, productId) {
  if (!btn) return;
  const added = isWishlisted(productId);
  btn.setAttribute('aria-pressed', String(added));
  const svg = btn.querySelector('svg');
  if (svg) {
    svg.setAttribute('fill', added ? 'var(--clr-neon-purple)' : 'none');
    svg.setAttribute('stroke', added ? 'var(--clr-neon-purple)' : 'currentColor');
  }
}

function syncAllWishlistButtons() {
  // Sinkronkan semua tombol hati (kartu katalog) dengan isi wishlist.
  const list = getWishlist();
  document.querySelectorAll('.product-card').forEach((card) => {
    const btn = card.querySelector('.wishlist-icon-btn');
    if (!btn) return;
    const id = Number(card.dataset.productId);
    syncWishlistBtnState(btn, id);
  });
  // Tombol hati di halaman detail.
  const detailBtn = document.querySelector('.wishlist-btn');
  if (detailBtn && detailBtn.dataset.productId) {
    syncWishlistBtnState(detailBtn, Number(detailBtn.dataset.productId));
  }
}

function refreshWishlistUI() {
  const list = getWishlist();
  const products = getProducts();
  const badge = document.getElementById('wishlist-badge');
  const itemsWrap = document.getElementById('wishlist-items');
  const clearBtn = document.getElementById('wishlist-clear');
  const toggleBtn = document.getElementById('wishlist-toggle');

  if (badge) { badge.textContent = String(list.length); badge.hidden = list.length === 0; }
  if (toggleBtn) toggleBtn.setAttribute('aria-label', `Wishlist (${list.length} item)`);
  if (clearBtn) clearBtn.hidden = list.length === 0;

  // Favorit berubah -> rekomendasi di landing ikut menyesuaikan.
  if (document.getElementById('featured-grid')) renderRecommendations();

  // Kartu di katalog harus kembali ke bentuk awal saat item dihapus.
  syncAllWishlistButtons();

  if (!itemsWrap) return;

  if (list.length === 0) {
    itemsWrap.innerHTML = `
      <div class="wishlist-empty">
        <span class="wishlist-empty__icon" aria-hidden="true">☆</span>
        <p>Wishlist kamu masih kosong.</p>
        <p class="wishlist-empty__hint">Tekan ikon ♥ pada produk untuk menyimpannya di device ini.</p>
      </div>`;
    return;
  }

  itemsWrap.innerHTML = list.map((id) => {
    const p = products.find(x => x.id === id);
    if (!p) return '';
    return `
      <a href="${detailUrl(p)}" class="wishlist-item">
        <img src="${escapeAttr(p.img)}" alt="" width="56" height="56" loading="lazy" />
        <span class="wishlist-item__info">
          <strong>${escapeHTML(p.name)}</strong>
          <span class="wishlist-item__price">${p.price ? formatRupiah(p.price) : 'Pre Order'}</span>
        </span>
        <button class="wishlist-item__remove" data-id="${p.id}" aria-label="Hapus ${escapeAttr(p.name)} dari wishlist" type="button">✕</button>
      </a>`;
  }).join('');

  itemsWrap.querySelectorAll('.wishlist-item__remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      removeFromWishlist(Number(btn.dataset.id));
    });
  });
}

function initWishlistPanel() {
  const toggleBtn = document.getElementById('wishlist-toggle');
  const panel = document.getElementById('wishlist-panel');
  const clearBtn = document.getElementById('wishlist-clear');
  if (!toggleBtn || !panel) return;

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = toggleBtn.getAttribute('aria-expanded') === 'true';
    toggleBtn.setAttribute('aria-expanded', String(!isOpen));
    panel.hidden = isOpen;
    if (!isOpen) refreshWishlistUI();
  });

  document.addEventListener('click', (e) => {
    if (panel.hidden) return;
    if (!panel.contains(e.target) && e.target !== toggleBtn && !toggleBtn.contains(e.target)) {
      panel.hidden = true;
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) {
      panel.hidden = true;
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.focus();
    }
  });

  if (clearBtn) clearBtn.addEventListener('click', clearWishlist);
  refreshWishlistUI();
}

/* ===============================================================
   INTRO / SPLASH SCREEN
   ---------------------------------------------------------------
   Markup intro ada langsung di index.html (elemen #intro).
   Halaman lain (katalog/detail/admin) tidak punya #intro dan/atau
   memakai <body class="no-intro">, sehingga fungsi ini langsung
   keluar tanpa error.
   =============================================================== */
const INTRO_SESSION_KEY = 'jn_intro_seen';
let introTimers = [];
let introStopDust = null;
let introWatchdog = null;

function introClearTimers() {
  introTimers.forEach(clearTimeout);
  introTimers = [];
  if (introWatchdog) { clearTimeout(introWatchdog); introWatchdog = null; }
}

/* Partikel debu cahaya (canvas ringan). Mengembalikan fungsi stop(). */
function initIntroDust(canvas) {
  const noop = () => {};
  if (!canvas || !canvas.getContext) return noop;
  const ctx = canvas.getContext('2d');
  if (!ctx) return noop;

  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0, h = 0, particles = [], rafId = null, running = true;

  const spawn = (randomY) => ({
    x: Math.random() * w,
    y: randomY ? Math.random() * h : h + 10,
    r: 0.6 + Math.random() * 2.2,
    baseAlpha: 0.18 + Math.random() * 0.55,
    vy: -(0.06 + Math.random() * 0.22),
    vx: (Math.random() - 0.5) * 0.16,
    drift: Math.random() * Math.PI * 2,
    driftSpeed: 0.004 + Math.random() * 0.01,
    twinkle: Math.random() * Math.PI * 2,
    twinkleSpeed: 0.008 + Math.random() * 0.02,
  });

  function resize() {
    w = canvas.clientWidth || window.innerWidth;
    h = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(90, Math.max(26, (w * h) / 22000)));
    particles = [];
    for (let i = 0; i < count; i++) particles.push(spawn(true));
  }

  function draw() {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.drift += p.driftSpeed;
      p.twinkle += p.twinkleSpeed;
      p.x += p.vx + Math.sin(p.drift) * 0.22;
      p.y += p.vy;
      if (p.y < -12 || p.x < -20 || p.x > w + 20) { particles[i] = spawn(false); continue; }
      const alpha = p.baseAlpha * (0.6 + 0.4 * Math.sin(p.twinkle));
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      grad.addColorStop(0, 'rgba(255, 226, 170, ' + alpha + ')');
      grad.addColorStop(0.45, 'rgba(242, 174, 99, ' + (alpha * 0.45) + ')');
      grad.addColorStop(1, 'rgba(242, 174, 99, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
      ctx.fill();
    }
    rafId = requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });
  if (reduce) {
    draw();
    running = false;
  } else {
    rafId = requestAnimationFrame(draw);
  }

  return function stop() {
    running = false;
    window.removeEventListener('resize', resize);
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  };
}

function finishIntro(intro) {
  introClearTimers();
  if (introStopDust) { introStopDust(); introStopDust = null; }
  try { sessionStorage.setItem(INTRO_SESSION_KEY, '1'); } catch (e) { /* private mode */ }
  intro.classList.add('intro--done');
  document.body.classList.add('intro-complete');
  document.body.classList.remove('intro-active');
  document.body.style.overflow = '';
}

function dismissIntroInstant(intro) {
  introClearTimers();
  if (introStopDust) { introStopDust(); introStopDust = null; }
  intro.style.display = 'none';
  document.body.classList.add('intro-complete');
  document.body.classList.remove('intro-active');
  document.body.style.overflow = '';
}

function initIntro() {
  const body = document.body;
  if (!body) return false;

  // Halaman non-intro (katalog/detail/admin) -> dilewati.
  if (body.classList.contains('no-intro')) {
    body.classList.add('intro-complete');
    return false;
  }

  const intro = document.getElementById('intro');
  if (!intro) {
    // Tidak ada markup intro -> pastikan halaman tetap tampil & bisa di-scroll.
    body.classList.add('intro-complete');
    body.classList.remove('intro-active');
    body.style.overflow = '';
    return false;
  }

  // Sudah pernah dilihat di sesi ini -> langsung sembunyikan.
  let seen = false;
  try { seen = sessionStorage.getItem(INTRO_SESSION_KEY) === '1'; } catch (e) { seen = false; }
  if (seen) { dismissIntroInstant(intro); return false; }

  // Kunci scroll HANYA selama intro berjalan.
  body.classList.add('intro-active');

  // Jaring pengaman: apa pun yang terjadi, intro HARUS hilang setelah 6 detik.
  introWatchdog = setTimeout(() => {
    if (!intro.classList.contains('intro--done')) finishIntro(intro);
  }, 6000);

  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  introStopDust = initIntroDust(document.getElementById('intro-dust'));

  if (reduce) {
    intro.style.transition = 'opacity 400ms ease';
    introTimers.push(setTimeout(() => {
      intro.style.opacity = '0';
      finishIntro(intro);
    }, 400));
    return true;
  }

  // 2.2s: tahan sejenak setelah animasi masuk, lalu mulai transisi keluar.
  introTimers.push(setTimeout(() => intro.classList.add('intro--animating'), 2200));
  // Panel menutup ~1.25s (delay 0.55s + durasi 0.7s) -> sembunyikan setelah 3.55s.
  introTimers.push(setTimeout(() => finishIntro(intro), 3550));

  const skipBtn = document.getElementById('intro-skip');
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      introClearTimers();
      if (introStopDust) { introStopDust(); introStopDust = null; }
      intro.classList.add('intro--skipping');
      // Tetap pasang jaring pengaman untuk jalur skip.
      introWatchdog = setTimeout(() => {
        if (!intro.classList.contains('intro--done')) finishIntro(intro);
      }, 1500);
      introTimers.push(setTimeout(() => finishIntro(intro), 500));
    });
  }

  return true;
}

/* ===============================================================
   NAVBAR
   =============================================================== */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  const isHeroPage = !document.body.classList.contains('no-intro');
  function updateNavbar() {
    if (isHeroPage) navbar.classList.toggle('scrolled', window.scrollY > 60);
  }
  window.addEventListener('scroll', updateNavbar, { passive: true });
  updateNavbar();
}

/* ===============================================================
   MOBILE MENU
   =============================================================== */
function initMobileMenu() {
  const toggle = document.getElementById('menu-toggle');
  const menu   = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;

  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

  function setOpen(open, focusFirst = false) {
    toggle.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    // Kunci scroll body saat menu terbuka supaya latar tidak ikut bergeser.
    document.body.classList.toggle('nav-open', open);
    if (open && focusFirst) {
      const firstLink = menu.querySelector('a');
      if (firstLink) firstLink.focus({ preventScroll: true });
    }
  }

  toggle.addEventListener('click', () => setOpen(!isOpen(), !isOpen()));

  // Overlay fullscreen: tombol "Tutup" di dalam menu.
  menu.querySelectorAll('[data-menu-close]').forEach(btn => {
    btn.addEventListener('click', () => { setOpen(false); toggle.focus(); });
  });

  // Tutup setelah memilih link (anchor in-page; link antar-halaman tetap navigasi).
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) {
      setOpen(false);
      toggle.focus();
    }
  });

  // Layar melebar ke desktop: menu mobile tidak relevan lagi.
  const mq = window.matchMedia('(min-width: 1025px)');
  const onWide = () => { if (mq.matches && isOpen()) setOpen(false); };
  mq.addEventListener ? mq.addEventListener('change', onWide) : mq.addListener(onWide);
}

/* ===============================================================
   FLOATING WHATSAPP BUTTON
   =============================================================== */
function initFAB() {
  const fab = document.getElementById('fab-whatsapp');
  if (!fab) return;
  const isHeroPage = !document.body.classList.contains('no-intro');
  function updateFAB() {
    const threshold = isHeroPage ? window.innerHeight * 0.8 : 100;
    fab.classList.toggle('fab--visible', window.scrollY > threshold);
  }
  window.addEventListener('scroll', updateFAB, { passive: true });
  if (!isHeroPage) setTimeout(() => fab.classList.add('fab--visible'), 300);
}

/* ===============================================================
   PARALLAX EFFECTS
   =============================================================== */
function initParallaxEffects() {
  const items = document.querySelectorAll('[data-parallax]');
  if (!items.length) return;

  items.forEach((item) => {
    const depth = Number(item.dataset.depth || 12);
    const media = item.querySelector('img');

    const reset = () => {
      item.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(0px)';
      if (media) media.style.transform = 'scale(1.02) translate3d(0, 0, 0)';
    };

    item.addEventListener('pointermove', (event) => {
      const rect = item.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      const rotateY = px * depth * 1.8;
      const rotateX = -py * depth * 1.8;
      const moveX = px * depth * 2;
      const moveY = py * depth * 2;
      item.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      if (media) media.style.transform = `scale(1.08) translate3d(${moveX}px, ${moveY}px, 0)`;
    });

    item.addEventListener('pointerleave', reset);
    item.addEventListener('pointercancel', reset);
    reset();
  });
}

function initFeaturedGrid() {
  syncProductCounts();
  const grid = document.getElementById('featured-grid');
  if (!grid) return;

  // ✅ WAJIB: kosongkan dulu (hapus "Memuat produk...")
  grid.innerHTML = '';

  const products = getProducts();
  const featured = products.slice(0, 6);

  if (featured.length === 0) {
    grid.innerHTML = '<p class="empty-state">Belum ada produk. <a href="admin.html">Tambah via panel admin.</a></p>';
    return;
  }

  const fragment = document.createDocumentFragment();
  featured.forEach(p => fragment.appendChild(createProductCard(p)));
  grid.appendChild(fragment);
}

/* ===============================================================
   SEGMENTED CONTROL + REKOMENDASI OTOMATIS (landing page)
   ---------------------------------------------------------------
   Tiga sinyal, satu skor:
     1. Pencarian   — kata kunci user (nama, subkategori, tag, kategori)
     2. Favorit     — isi wishlist + kemiripan kategori/tag
     3. Model       — pilihan segmen (Ruang Tamu / Ruang Makan)

   Skor dihitung ulang tiap sinyal berubah, tanpa reload.
   =============================================================== */
const SEG_KEY = 'imj_segment_v1';

function getSavedSegment() {
  try { return localStorage.getItem(SEG_KEY) || 'tamu'; } catch { return 'tamu'; }
}

function saveSegment(seg) {
  try { localStorage.setItem(SEG_KEY, seg); } catch {}
}

// Pecah query jadi token, buang kata yang tidak informatif.
function queryTokens(query) {
  const stop = new Set(['dan', 'yang', 'untuk', 'dengan', 'di', 'ke', 'dari', 'atau', 'saya', 'mau', 'cari', 'mencari']);
  return String(query || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(t => t.length >= 2 && !stop.has(t));
}

// Teks yang boleh dicocokkan untuk satu produk.
function searchableText(p) {
  return [p.name, p.subcategory, p.category, p.desc, p.material, p.woodType, p.finishing]
    .concat(Array.isArray(p.tags) ? p.tags : [])
    .concat(Array.isArray(p.warna) ? p.warna : [])
    .filter(Boolean).join(' ').toLowerCase();
}

function scoreProduct(p, ctx) {
  let score = 0;
  const reasons = [];

  // --- Sinyal 1: pencarian ---
  // Pencarian adalah niat eksplisit: harus MENGALAHKAN sinyal pasif
  // (segmen/favorit). Produk yang tidak cocok kata kunci diberi penalti
  // besar supaya tidak muncul di atas hasil yang benar-benar cocok.
  if (ctx.tokens.length) {
    const hay = searchableText(p);
    const nameLower = String(p.name || '').toLowerCase();
    let hits = 0;
    ctx.tokens.forEach(t => { if (hay.includes(t)) hits++; });
    if (hits) {
      score += hits * 12;
      // Bonus kalau kena di nama produk (paling relevan)
      if (ctx.tokens.some(t => nameLower.includes(t))) score += 5;
      reasons.push('cocok pencarian');
    } else {
      score -= 10;
    }
  }

  // --- Sinyal 2: favorit ---
  if (ctx.wishIds.length) {
    if (ctx.wishIds.includes(Number(p.id))) {
      score += 4;
      reasons.push('ada di favorit');
    } else {
      if (ctx.wishCats.has(p.category)) { score += 2.5; reasons.push('kategori favorit'); }
      const pTags = Array.isArray(p.tags) ? p.tags : [];
      if (pTags.some(t => ctx.wishTags.has(t))) { score += 1.5; reasons.push('gaya mirip favorit'); }
    }
  }

  // --- Sinyal 3: model / segmen ---
  if (ctx.segCat) {
    if (p.category === ctx.segCat) { score += 6; reasons.push('sesuai model'); }
    else {
      // Subkategori masih satu keluarga ruang -> separuh nilai
      const related = { sofa: ['kursi', 'meja'], meja: ['kursi', 'lemari'], kursi: ['meja'], lemari: ['kursi'] };
      if ((related[ctx.segCat] || []).includes(p.category)) score += 1.5;
    }
  }

  // --- Kesehatan stok: jangan rekomendasikan barang habis ---
  const stock = Number(p.stock ?? 0);
  if (stock === 0) score -= 3;
  else if (stock < 10) score += 0.5;

  return { score, reasons };
}

/* ---------------------------------------------------------------
   REKOMENDASI: KUOTA DOMINAN, BUKAN SKOR SAJA
   User klik "meja" -> minimal 4 dari 6 kartu HARUS meja.
   Skor dipakai untuk mengurutkan di dalam kuota dan untuk mengisi
   sisanya; skor tidak boleh menenggelamkan kategori yang dipilih.
   --------------------------------------------------------------- */
const DOMINANT_QUOTA = 4;

function buildRecommendations(products, ctx, limit = 6) {
  const active = products.filter(p => (p.status || 'aktif') === 'aktif');
  const pool = active.length ? active : products;

  const scored = pool.map(p => {
    const { score, reasons } = scoreProduct(p, ctx);
    return { p, score, reasons };
  });
  scored.sort((a, b) => b.score - a.score || Number(a.p.id) - Number(b.p.id));

  const domCat = ctx.dominantCat;

  // Pencarian adalah niat eksplisit: kalau user mengetik, kuota kategori
  // TIDAK dipaksakan — hasil yang tidak cocok kata kunci tidak boleh muncul.
  if (!domCat || ctx.tokens.length) return scored.slice(0, limit);

  const same = scored.filter(t => t.p.category === domCat);
  const rest = scored.filter(t => t.p.category !== domCat);

  // Ambil sebanyak kuota (atau semua yang ada kalau kategori lebih sedikit),
  // lalu isi sisanya dari kategori lain.
  const takeSame = Math.min(same.length, Math.max(DOMINANT_QUOTA, limit - rest.length));
  return same.slice(0, takeSame).concat(rest).slice(0, limit);
}

function describeReasons(ctx, top, domCat) {
  if (ctx.tokens.length) {
    const n = top.length;
    return `Hasil pencarian "${ctx.tokens.join(' ')}" · ${n} produk cocok.`;
  }
  if (domCat) {
    const n = top.filter(t => t.p && t.p.category === domCat).length;
    const label = domCat.charAt(0).toUpperCase() + domCat.slice(1);
    const sisa = top.length - n;
    return `Dominan ${label} · ${n} ${label.toLowerCase()}` +
           (sisa > 0 ? ` + ${sisa} pelengkap dari kategori lain.` : '.');
  }
  if (ctx.wishIds.length) return `Disesuaikan dari ${ctx.wishIds.length} favorit kamu.`;
  return 'Paling sering dipesan pelanggan. Klik kategori untuk menyesuaikan.';
}

/* State rekomendasi terpusat: satu sumber kebenaran untuk semua pemicu
   (kartu kategori, segmen ruang, pencarian, favorit). Disimpan di
   sessionStorage supaya tidak reset saat pindah halaman lalu kembali. */
const RECO_KEY = 'ine_reco_cat';

function getRecoCategory() {
  try { return sessionStorage.getItem(RECO_KEY) || null; } catch { return null; }
}
function setRecoCategory(cat) {
  try {
    if (cat) sessionStorage.setItem(RECO_KEY, cat);
    else sessionStorage.removeItem(RECO_KEY);
  } catch { /* private mode: state hanya hidup di memori */ }
  renderRecommendations();
}

function renderRecommendations() {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;

  const products = getProducts();
  if (!products.length) return;

  const segBtn = document.querySelector('#seg-control .seg__btn[aria-checked="true"]');
  // Kategori dominan: klik eksplisit user menang atas segmen.
  const domCat = getRecoCategory() || (segBtn ? segBtn.dataset.cat : null);
  const ctx = {
    tokens:  queryTokens(document.getElementById('reco-search')?.value || ''),
    wishIds: getWishlist(),
    wishCats: new Set(),
    wishTags: new Set(),
    segCat:  segBtn ? segBtn.dataset.cat : null,
    dominantCat: domCat,
  };

  // Turunkan kategori & tag favorit dari wishlist
  ctx.wishIds.forEach(id => {
    const p = products.find(x => Number(x.id) === Number(id));
    if (!p) return;
    if (p.category) ctx.wishCats.add(p.category);
    (Array.isArray(p.tags) ? p.tags : []).forEach(t => ctx.wishTags.add(t));
  });

  let top = buildRecommendations(products, ctx, 6);

  // Kalau user mengetik, jangan tampilkan yang tidak cocok sama sekali —
  // hasil kosong lebih jujur daripada 6 kartu yang tidak relevan.
  if (ctx.tokens.length) {
    const matched = top.filter(t => t.reasons.includes('cocok pencarian'));
    if (matched.length) top = matched;
  }

  grid.innerHTML = '';
  if (!top.length) {
    grid.innerHTML = '<p class="empty-state">Belum ada produk yang cocok. Coba kata kunci lain.</p>';
  } else {
    const frag = document.createDocumentFragment();
    top.forEach(({ p, reasons }) => {
      const card = createProductCard(p);
      // Penanda kenapa produk ini muncul — transparan ke pembeli.
      const flagText = reasons.length ? reasons[0] : null;
      if (flagText) {
        const flag = document.createElement('p');
        flag.className = 'reco-flag';
        flag.textContent = '♥ ' + flagText;
        card.querySelector('.product-card__body')?.prepend(flag);
      }
      frag.appendChild(card);
    });
    grid.appendChild(frag);
  }

  const reasonEl = document.getElementById('reco-reason');
  if (reasonEl) reasonEl.textContent = describeReasons(ctx, top, domCat);
}

/* Angka pendukung di CTA dihitung dari data, bukan hardcode. */
function renderCtaStat() {
  const el = document.getElementById('cta-stat');
  if (!el) return;
  const products = getProducts().filter(p => (p.status || 'aktif') === 'aktif');
  if (!products.length) { el.textContent = ''; return; }
  const cats = new Set(products.map(p => p.category).filter(Boolean));
  el.textContent = `${products.length} produk · ${cats.size} kategori · bisa custom ukuran`;
}

/* ---------------------------------------------------------------
   SCENE HERO
   Set state (layout morph), gambar garis (stroke draw), lalu nyalakan
   gerak (swing/bob/floaty). Auto-morph sekali supaya user melihat
   bahwa scene ini hidup, lalu diam sampai user klik.
   --------------------------------------------------------------- */
const SCENE_LABEL = {
  tamu:  'Ilustrasi ruang tamu: sofa, meja kopi, dan lampu gantung',
  makan: 'Ilustrasi ruang makan: meja makan panjang, kursi, dan lampu gantung',
};

let _suppressReco = false;

function setSceneState(state, cat) {
  const stage = document.getElementById('hero-stage');
  if (!stage) return;
  if (!SCENE_LABEL[state]) state = 'tamu';

  stage.dataset.state = state;
  stage.setAttribute('aria-label', SCENE_LABEL[state]);

  // 2. Stroke draw: reset instan lalu gambar ulang, supaya animasinya
  //    terlihat setiap state berubah, bukan cuma sekali saat load.
  //    Transition punya delay 400ms, jadi reset harus di-commit lewat
  //    reflow (offsetWidth) — kalau tidak, nilai 0 lama masih berlaku
  //    saat di-set balik dan tidak ada perubahan yang dianimasikan.
  const lines = stage.querySelectorAll('.scene__line');
  stage.dataset.drawn = '0';
  lines.forEach(l => { l.style.transition = 'none'; l.style.strokeDashoffset = '1'; });
  void stage.offsetWidth;
  lines.forEach(l => { l.style.transition = ''; l.style.strokeDashoffset = ''; });
  stage.dataset.drawn = '1';

  // 3. Gerak: nyalakan setelah morph pertama selesai (800ms).
  clearTimeout(stage._motionTimer);
  stage._motionTimer = setTimeout(() => { stage.dataset.motion = '1'; }, 900);

  // Klik segmen juga mengubah kategori dominan rekomendasi.
  // Auto-morph tidak boleh menimpa pilihan user (_suppressReco).
  if (cat && !_suppressReco) setRecoCategory(cat);
}

/* Semua elemen ber-data-category jadi pemicu rekomendasi:
   kartu kategori, segmen ruang, dan pill filter kalau ada. */
function initCategoryTriggers() {
  document.querySelectorAll('.cat-card[data-category]').forEach(card => {
    const cat = card.dataset.category;
    const link = card.querySelector('.cat-card__link');
    // Klik = sesuaikan rekomendasi di tempat, Ctrl/Cmd+klik tetap buka katalog.
    card.addEventListener('click', (e) => {
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      e.preventDefault();
      setRecoCategory(cat);
      card.classList.add('is-selected');
      document.querySelectorAll('.cat-card.is-selected').forEach(c => {
        if (c !== card) c.classList.remove('is-selected');
      });
      document.getElementById('featured-heading')?.scrollIntoView({
        behavior: 'smooth', block: 'center',
      });
    });
    if (link) link.setAttribute('aria-label',
      `Sesuaikan rekomendasi ke ${card.dataset.category}`);
  });
}

function initSegControl() {
  const seg = document.getElementById('seg-control');
  if (!seg) return;

  const btns = Array.from(seg.querySelectorAll('.seg__btn'));
  if (!btns.length) return;

  const thumb = seg.querySelector('.seg__thumb');

  // Thumb morph: posisi + lebar diambil dari tombol aktif yang sebenarnya.
  const moveThumb = (btn) => {
    if (!thumb) return;
    const pad = 4; // = --s1
    thumb.style.left = `${btn.offsetLeft - pad}px`;
    thumb.style.width = `${btn.offsetWidth + pad * 2 - 8}px`;
  };

  // userInitiated=false saat restore: jangan timpa kategori pilihan user
  // yang tersimpan di sessionStorage.
  const select = (btn, focus = false, userInitiated = false) => {
    btns.forEach(b => {
      const on = b === btn;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    seg.dataset.morph = btn.dataset.seg;

    moveThumb(btn);

    // Scene hero ikut berganti state (layout morph CSS yang menggerakkan blok)
    setSceneState(btn.dataset.seg, userInitiated ? btn.dataset.cat : null);

    saveSegment(btn.dataset.seg);
    renderRecommendations();
    if (focus) btn.focus();
  };

  // Font selesai dimuat / layar berubah -> ukur ulang
  const reflow = () => {
    const active = seg.querySelector('.seg__btn[aria-checked="true"]');
    if (active) moveThumb(active);
  };
  window.addEventListener('resize', reflow, { passive: true });
  if (document.fonts?.ready) document.fonts.ready.then(reflow);

  btns.forEach(btn => {
    btn.addEventListener('click', () => select(btn, false, true));
  });

  // Panah kiri/kanan — perilaku radiogroup standar
  seg.addEventListener('keydown', (e) => {
    const i = btns.indexOf(document.activeElement);
    if (i < 0) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = e.key === 'ArrowRight' ? (i + 1) % btns.length : (i - 1 + btns.length) % btns.length;
      select(btns[next], true, true);
    }
  });

  // Pulihkan pilihan terakhir
  const saved = getSavedSegment();
  const start = btns.find(b => b.dataset.seg === saved) || btns[0];
  select(start);
}

function initRecoSearch() {
  const input = document.getElementById('reco-search');
  if (!input) return;

  const clearBtn = document.getElementById('reco-search-clear');
  const grid = document.getElementById('featured-grid');

  // Scroll halus ke grid produk, hanya kalau hasilnya memang di luar layar.
  const scrollToResults = () => {
    if (!grid || !grid.children.length) return;
    const rect = grid.getBoundingClientRect();
    const visible = rect.top < window.innerHeight * 0.75 && rect.bottom > 0;
    if (visible) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    grid.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  let timer = null;
  input.addEventListener('input', () => {
    if (clearBtn) clearBtn.hidden = !input.value;
    clearTimeout(timer);
    // Debounce 180ms — cukup responsif, tidak render tiap ketukan
    timer = setTimeout(() => {
      renderRecommendations();
      scrollToResults();
    }, 180);
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      clearBtn.hidden = true;
      renderRecommendations();
      input.focus();
    });
  }

  // Enter tidak reload halaman — langsung lompat ke hasil
  input.closest('form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    renderRecommendations();
    scrollToResults();
  });
}
/* ===============================================================
   CATALOG PAGE (katalog.html)
   =============================================================== */
let currentFilter      = 'semua';
let currentPriceFilter = 'all';
let currentSort        = 'newest';
let currentStatus      = 'aktif';
let visibleCount       = 12;
let PAGE_SIZE          = 12;

function filteredAndSorted() {
  let list = getProducts();

  if (currentStatus !== 'semua') {
    list = list.filter(p => (p.status || 'aktif') === currentStatus);
  }

  if (currentFilter !== 'semua') {
    list = list.filter(p => p.category === currentFilter);
  }

  if (currentPriceFilter !== 'all') {
    if (currentPriceFilter === '0-2000000') list = list.filter(p => p.price != null && p.price < 2000000);
    else if (currentPriceFilter === '2000000-5000000') list = list.filter(p => p.price != null && p.price >= 2000000 && p.price <= 5000000);
    else if (currentPriceFilter === '5000000-10000000') list = list.filter(p => p.price != null && p.price > 5000000 && p.price <= 10000000);
    else if (currentPriceFilter === '10000000+') list = list.filter(p => p.price != null && p.price > 10000000);
  }

  switch (currentSort) {
    // Produk tanpa harga (Pre Order) selalu di akhir, apa pun arah sortirnya.
    case 'price-asc':  list.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity)); break;
    case 'price-desc': list.sort((a, b) => (b.price ?? -1) - (a.price ?? -1)); break;
    case 'name':       list.sort((a, b) => a.name.localeCompare(b.name, 'id')); break;
    case 'stock':      list.sort((a, b) => (b.stock || 0) - (a.stock || 0)); break;
  }
  return list;
}

function renderCatalogGrid() {
  const grid = document.getElementById('catalog-grid');
  if (!grid) return;

  const list    = filteredAndSorted();
  const visible = list.slice(0, visibleCount);

  grid.style.opacity = '0';
  grid.style.transition = 'opacity 180ms ease';

  setTimeout(() => {
    grid.innerHTML = '';
    if (visible.length === 0) {
      // Empty state harus punya jalan keluar, bukan jalan buntu.
      grid.innerHTML = `
        <div class="empty-state empty-state--catalog">
          <strong>Tidak ada produk yang cocok</strong>
          <p>Kombinasi kategori dan harga ini belum ada isinya. Coba longgarkan filter, atau tanya kami — banyak produk bisa dibuat custom.</p>
          <button class="btn btn--primary" type="button" id="reset-filter-btn">Tampilkan semua produk</button>
        </div>`;
      const resetBtn = grid.querySelector('#reset-filter-btn');
      if (resetBtn) resetBtn.addEventListener('click', () => {
        currentPriceFilter = 'all';
        document.querySelectorAll('[data-price].active').forEach(b => b.classList.remove('active'));
        setFilter('semua');
      });
    } else {
      const fragment = document.createDocumentFragment();
      visible.forEach(p => fragment.appendChild(createProductCard(p)));
      grid.appendChild(fragment);
    }
    grid.style.opacity = '1';
  }, 160);

  const countEl = document.getElementById('catalog-count');
  if (countEl) {
    countEl.innerHTML = `Menampilkan <strong>${Math.min(visibleCount, list.length)}</strong> dari <strong>${list.length}</strong> produk`;
  }

  const loadMoreBtn = document.getElementById('load-more-btn');
  if (loadMoreBtn) {
    // hidden (bukan display) supaya tidak bisa diklik keyboard saat sudah habis.
    loadMoreBtn.hidden = visibleCount >= list.length;
    loadMoreBtn.style.display = visibleCount >= list.length ? 'none' : '';
  }
}

function setFilter(value) {
  currentFilter = value;
  visibleCount  = PAGE_SIZE;
  document.querySelectorAll('.pill[data-filter]').forEach(p => p.classList.toggle('active', p.dataset.filter === value));
  document.querySelectorAll('.sidebar-filter-btn[data-filter]').forEach(b => b.classList.toggle('active', b.dataset.filter === value));
  renderCatalogGrid();
}

function initCatalogPage() {
  const grid = document.getElementById('catalog-grid');
  if (!grid) return;

  const params   = new URLSearchParams(window.location.search);
  const katParam = params.get('kategori');
  if (katParam) currentFilter = katParam;

  const perPageSel = document.getElementById('per-page-select');
  if (perPageSel) {
    PAGE_SIZE = parseInt(perPageSel.value, 10) || 12;
    visibleCount = PAGE_SIZE;
    perPageSel.addEventListener('change', () => {
      PAGE_SIZE = parseInt(perPageSel.value, 10) || 12;
      visibleCount = PAGE_SIZE;
      renderCatalogGrid();
    });
  }

  function updateSidebarCounts() {
    const products = getProducts().filter(p => (p.status || 'aktif') === 'aktif');
    const countSemua = document.querySelector('.sidebar-filter-btn[data-filter="semua"] .filter-count');
    if (countSemua) countSemua.textContent = products.length;
    ['kursi', 'meja', 'sofa', 'lemari'].forEach(cat => {
      const el = document.querySelector(`.sidebar-filter-btn[data-filter="${cat}"] .filter-count`);
      if (el) el.textContent = products.filter(p => p.category === cat).length;
    });
  }

  updateSidebarCounts();
  syncProductCounts();
  renderCatalogGrid();

  document.querySelectorAll('.status-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.status-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentStatus = pill.dataset.status;
      visibleCount = PAGE_SIZE;
      renderCatalogGrid();
    });
  });

  document.querySelectorAll('.pill[data-filter]').forEach(pill => {
    pill.addEventListener('click', () => setFilter(pill.dataset.filter));
  });
  document.querySelectorAll('.sidebar-filter-btn[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => setFilter(btn.dataset.filter));
  });
  document.querySelectorAll('.sidebar-filter-btn[data-price]').forEach(btn => {
    btn.addEventListener('click', () => {
      const priceVal = btn.dataset.price;
      if (currentPriceFilter === priceVal) {
        currentPriceFilter = 'all';
        btn.classList.remove('active');
      } else {
        document.querySelectorAll('.sidebar-filter-btn[data-price]').forEach(b => b.classList.remove('active'));
        currentPriceFilter = priceVal;
        btn.classList.add('active');
      }
      visibleCount = PAGE_SIZE;
      renderCatalogGrid();
    });
  });

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      currentSort  = sortSelect.value;
      visibleCount = PAGE_SIZE;
      renderCatalogGrid();
    });
  }

  const loadMoreBtn = document.getElementById('load-more-btn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      visibleCount += PAGE_SIZE;
      renderCatalogGrid();
    });
  }
}

/* ===============================================================
   PRODUCT DETAIL PAGE (detail.html)
   =============================================================== */
async function fetchProductBySku(sku) {
  // Ambil produk langsung dari API by SKU. Ini satu-satunya cara yang benar:
  // daftar /api/products hanya berisi produk berstatus 'aktif', sehingga
  // mencari produk di cache bisa gagal (produk draft/nonaktif atau cache basi).
  try {
    const res = await fetch(`${API_BASE}/products?sku=${encodeURIComponent(sku)}`, {
      headers: { Accept: 'application/json' },
    });
    const data = await res.json();
    if (!res.ok || !data.success || !data.product) return null;
    return data.product;
  } catch {
    return null;
  }
}

/* ---------- Detail page: helper untuk state template ---------- */
function setDetailStatus(message, isError) {
  const statusEl = document.getElementById('product-detail-status');
  if (!statusEl) return;
  if (!message) { statusEl.hidden = true; statusEl.textContent = ''; return; }
  statusEl.hidden = false;
  statusEl.textContent = message;
  statusEl.classList.toggle('empty-state--error', Boolean(isError));
}

function showDetailContent(show) {
  const gallery = document.getElementById('product-gallery');
  const info    = document.getElementById('product-info');
  if (gallery) gallery.hidden = !show;
  if (info) info.hidden = !show;
  const detail = document.getElementById('product-detail');
  if (detail) detail.dataset.state = show ? 'ready' : 'empty';
}

/* Redirect ke halaman 404 (dipakai saat produk/SKU tidak ditemukan). */
function goTo404() {
  window.location.replace('404.html');
}

/* ---------- Detail page: render galeri dari data produk ---------- */
function renderDetailGallery(product) {
  const galleryMain = document.getElementById('gallery-main-img');
  const thumbsWrap  = document.getElementById('product-thumbs-container');
  if (!galleryMain) return;

  // Kumpulkan sumber foto: foto utama + foto tambahan (unik, tanpa duplikat).
  const sources = [];
  const push = (src) => { if (src && !sources.includes(src)) sources.push(src); };
  push(product.img);
  (Array.isArray(product.images) ? product.images : []).forEach(push);

  if (!sources.length) {
    galleryMain.removeAttribute('src');
    if (thumbsWrap) thumbsWrap.innerHTML = '';
    return;
  }

  galleryMain.src = sources[0];
  galleryMain.alt = product.imgAlt || product.name || 'Foto produk';

  if (!thumbsWrap) return;
  thumbsWrap.innerHTML = '';

  // Thumb hanya perlu ditampilkan kalau ada lebih dari 1 foto.
  if (sources.length < 2) return;

  const fragment = document.createDocumentFragment();
  sources.forEach((src, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'thumb-btn' + (index === 0 ? ' active' : '');
    btn.setAttribute('role', 'listitem');
    btn.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');
    btn.setAttribute('aria-label', `Foto ${index + 1} dari ${sources.length}`);
    btn.dataset.src = src;

    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.width = 200;
    img.height = 180;
    img.loading = 'lazy';
    img.decoding = 'async';

    btn.appendChild(img);
    fragment.appendChild(btn);
  });
  thumbsWrap.appendChild(fragment);
}

async function initDetailPage() {
  const galleryMain = document.getElementById('gallery-main-img');
  if (!galleryMain) return;

  const params   = new URLSearchParams(window.location.search);
  const skuParam = (params.get('sku') || '').trim();
  const id       = parseInt(params.get('id'), 10);

  // Template dulu: sembunyikan konten, tampilkan status "memuat".
  showDetailContent(false);
  setDetailStatus('Memuat produk...', false);

  // 1) Prioritas: muat langsung dari server by SKU (paling akurat).
  let product = null;
  if (skuParam) {
    product = await fetchProductBySku(skuParam);
  }

  // 2) Fallback: cari di cache produk berdasarkan SKU (case-insensitive) / ID.
  //    CATATAN: TIDAK ada fallback ke products[0] — kalau tidak ketemu, kita
  //    tampilkan pesan "tidak ditemukan", bukan produk yang salah.
  const products = getProducts();
  if (!product) {
    const wanted = skuParam.toUpperCase();
    product =
      (wanted ? products.find(p => (p.sku || '').toUpperCase() === wanted) : null) ||
      (id ? products.find(p => p.id === id) : null) ||
      null;
  }

  // 3) Tidak ketemu -> langsung ke halaman 404.html.
  if (!product) {
    goTo404();
    return;
  }

  {
    document.title = `${product.name} - Ine Mebel Jepara`;

    // Statistik: catat produk yang dilihat + halaman detail ini.
    trackProductView(product.id);
    trackPageView('detail');

    const crumb = document.getElementById('breadcrumb-product');
    if (crumb) crumb.textContent = product.name;

    // Galeri + thumbnail dibangun dari data produk (tanpa mapping hardcode).
    renderDetailGallery(product);

    const catEl = document.getElementById('product-category');
    if (catEl) catEl.textContent = product.category
      ? product.category.charAt(0).toUpperCase() + product.category.slice(1)
      : '';

    const nameEl = document.getElementById('product-name');
    if (nameEl) nameEl.textContent = product.name;

    const priceEl = document.querySelector('.price-main');
    if (priceEl) {
      const isPreorder = product.availability === 'preorder' || product.preorder;
      if (!product.price) {
        // Harga kosong → tampilkan Pre Order ke WhatsApp
        const waTextPO = encodeURIComponent(`Halo Ine Mebel Jepara, saya tertarik dengan ${product.name}${product.sku ? ` (${product.sku})` : ''}. Berapa harganya dan bagaimana cara pre order?`);
        priceEl.innerHTML = `<a href="https://wa.me/6285281587738?text=${waTextPO}" target="_blank" rel="noopener noreferrer"
          class="detail-preorder-link" aria-label="Pre Order ${product.name} via WhatsApp">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
          Pre Order ke WhatsApp
        </a>`;
      } else if (product.discountPrice && product.discountPrice < product.price) {
        priceEl.innerHTML = `${formatRupiah(product.discountPrice)} <span style="text-decoration:line-through;color:var(--text-muted);font-size:0.7em;margin-left:0.5rem;">${formatRupiah(product.price)}</span>`;
      } else {
        priceEl.textContent = formatRupiah(product.price);
      }
    }

    const codeEl = document.getElementById('product-code');
    if (codeEl && product.sku) codeEl.textContent = `#${product.sku}`;

    const descEl = document.querySelector('.product-info__desc');
    if (descEl) descEl.textContent = product.desc || '';

    const warnaEl = document.getElementById('spec-warna');
    if (warnaEl) warnaEl.textContent = product.warna || '-';

    const pelengkapEl = document.getElementById('spec-pelengkap');
    if (pelengkapEl) pelengkapEl.textContent = product.pelengkap || '-';

    const materialEl = document.getElementById('spec-material');
    if (materialEl) materialEl.textContent = product.material || '-';

    const dimensiEl = document.getElementById('spec-dimensi');
    if (dimensiEl) {
      const p = product.dimensiPanjang || 0;
      const l = product.dimensiLebar || 0;
      const t = product.dimensiTinggi || 0;
      dimensiEl.textContent = (p || l || t) ? `P ${p} x L ${l} x T ${t} cm` : '-';
    }

    const beratEl = document.getElementById('spec-berat');
    if (beratEl) beratEl.textContent = product.berat ? `${product.berat} kg` : '-';

    const finishingEl = document.getElementById('spec-finishing');
    if (finishingEl) finishingEl.textContent = product.finishing || '-';

    const garansiEl = document.getElementById('spec-garansi');
    if (garansiEl) garansiEl.textContent = product.garansi || '-';

    renderPreOrderFacts(product);

    // Tombol pesan utama: pesan WhatsApp sudah terisi nama produk + SKU.
    // Pengunjung baru tidak perlu mengetik apa pun.
    const waBtn = document.getElementById('product-wa-order-btn');
    if (waBtn) {
      const msg = encodeURIComponent(
        `Halo Ine Mebel Jepara, saya mau pesan ${product.name}${product.sku ? ` (${product.sku})` : ''}. Apakah stoknya tersedia?`
      );
      waBtn.href = `https://wa.me/6285281587738?text=${msg}`;
      waBtn.setAttribute('aria-label', `Pesan ${product.name} lewat WhatsApp`);
    }

    const consultLink = document.querySelector('.consult-cta a');
    if (consultLink) {
      const msg = encodeURIComponent(`Halo, saya tertarik dengan ${product.name}. Bisa minta info lebih lanjut?`);
      consultLink.href = `https://wa.me/6285281587738?text=${msg}`;
    }

    const relatedGrid = document.getElementById('related-grid');
    if (relatedGrid) {
      const related = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 3);
      if (related.length) {
        relatedGrid.innerHTML = '';
        const fragment = document.createDocumentFragment();
        related.forEach(p => fragment.appendChild(createProductCard(p)));
        relatedGrid.appendChild(fragment);
      } else {
        relatedGrid.innerHTML = '<p class="empty-state">Tidak ada produk terkait lainnya.</p>';
      }
    }

    // Tampilkan konten hanya setelah semuanya terisi.
    showDetailContent(true);
    setDetailStatus('', false);
  }

  // ---- Thumbnail: delegated, karena tombol digenerate dinamis ----
  const thumbsWrap = document.getElementById('product-thumbs-container');
  if (thumbsWrap) {
    thumbsWrap.addEventListener('click', (event) => {
      const btn = event.target.closest('.thumb-btn');
      if (!btn || !thumbsWrap.contains(btn)) return;
      const src = btn.dataset.src;
      if (!src) return;
      thumbsWrap.querySelectorAll('.thumb-btn').forEach((b) => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-pressed', String(b === btn));
      });
      galleryMain.style.opacity = '0';
      galleryMain.style.transition = 'opacity 180ms ease';
      setTimeout(() => { galleryMain.src = src; galleryMain.style.opacity = '1'; }, 160);
    });
  }

  const wishlistBtn = document.querySelector('.wishlist-btn');
  if (wishlistBtn && product) {
    wishlistBtn.dataset.productId = String(product.id);
    syncWishlistBtnState(wishlistBtn, product.id);
    wishlistBtn.addEventListener('click', () => {
      toggleWishlist(product.id);
      syncWishlistBtnState(wishlistBtn, product.id);
    });
  }
}

/* ===============================================================
   SEBELUM PESAN + STICKY ORDER BAR (detail.html)
   Pembeli baru ragu soal ukuran, perakitan, dan berat.
   Jawab di halaman, jangan paksa mereka chat dulu.
   =============================================================== */
function renderPreOrderFacts(product) {
  const wrap = document.getElementById('pre-order-facts');
  if (!wrap) return;

  const p = Number(product.dimensiPanjang) || 0;
  const l = Number(product.dimensiLebar) || 0;
  const t = Number(product.dimensiTinggi) || 0;

  const ruang = document.getElementById('fact-ruang');
  if (ruang) {
    if (p && l && t) {
      // Ruang gerak minimal 60cm di tiap sisi supaya tidak terasa sesak.
      ruang.textContent = `Butuh ruang sekitar ${p + 60} x ${l + 60} cm, termasuk sisa gerak ${60} cm di tiap sisi.`;
    } else {
      ruang.textContent = 'Ukuran detail belum dicatat. Tanya kami lewat WhatsApp.';
    }
  }

  const rakit = document.getElementById('fact-rakit');
  if (rakit) {
    const sudah = (product.perakitan || '').toLowerCase();
    rakit.textContent = sudah === 'sudah'
      ? 'Datang sudah terpasang. Tidak perlu bongkar-pasang sendiri.'
      : sudah === 'belum'
        ? 'Dikirim terurai. Kami sertakan panduan dan video pasang.'
        : 'Tanya kami soal perakitan sebelum pesan.';
  }

  const berat = document.getElementById('fact-berat');
  if (berat) {
    const kg = Number(product.berat) || 0;
    const beban = Number(product.kapasitasBeban) || 0;
    const parts = [];
    if (kg) parts.push(`${kg} kg`);
    if (beban) parts.push(`kuat menahan sampai ${beban} kg`);
    berat.textContent = parts.length
      ? parts.join(', ') + '. Dua orang cukup untuk mengangkat.'
      : 'Tanya kami soal berat dan cara angkat.';
  }

  const kayu = document.getElementById('fact-kayu');
  if (kayu) {
    const parts = [];
    if (product.woodType) parts.push(`kayu ${String(product.woodType).toLowerCase()}`);
    if (product.finishing) parts.push(`finishing ${String(product.finishing).toLowerCase()}`);
    if (product.warna) parts.push(`pilihan warna: ${product.warna}`);
    kayu.textContent = parts.length ? parts.join(' · ') : 'Tanya kami soal material.';
  }

  wrap.hidden = false;

  initStickyOrder(product);
}

function initStickyOrder(product) {
  const bar = document.getElementById('sticky-order');
  if (!bar) return;

  const nameEl = document.getElementById('sticky-order-name');
  const priceEl = document.getElementById('sticky-order-price');
  const btn = document.getElementById('sticky-order-btn');

  const displayPrice = (product.discountPrice && product.discountPrice < product.price)
    ? product.discountPrice : product.price;

  if (nameEl) nameEl.textContent = product.name;
  if (priceEl) {
    priceEl.textContent = displayPrice
      ? formatRupiah(displayPrice)
      : 'Pre Order';
  }
  if (btn) {
    const msg = encodeURIComponent(
      `Halo Ine Mebel Jepara, saya mau pesan ${product.name}${product.sku ? ` (${product.sku})` : ''}. Apakah stoknya tersedia?`
    );
    btn.href = `https://wa.me/6285281587738?text=${msg}`;
    btn.setAttribute('aria-label', `Pesan ${product.name} lewat WhatsApp`);
  }

  // Bar pesan selalu tampil di mobile (CSS @media yang atur) dan disembunyikan
  // di desktop. Tanpa logika scroll: pembeli baru tidak pernah kehilangan CTA.
  bar.hidden = false;
}

/* ===============================================================
   CATALOG HINT — tombol X untuk menyembunyikan banner sementara
   Disimpan di sessionStorage: hilang saat tab ditutup, kembali lagi
   di kunjungan berikutnya (bukan permanen, sesuai permintaan).
   =============================================================== */
const HINT_KEY = 'imj_hint_hidden';

function initCatalogHint() {
  const banner = document.getElementById('catalog-hint-banner');
  const closeBtn = document.getElementById('catalog-hint-close');
  if (!banner || !closeBtn) return;

  try {
    if (sessionStorage.getItem(HINT_KEY) === '1') {
      banner.hidden = true;
      return;
    }
  } catch { /* private mode: banner tetap tampil */ }

  closeBtn.addEventListener('click', () => {
    banner.hidden = true;
    try { sessionStorage.setItem(HINT_KEY, '1'); } catch { /* abaikan */ }
  });
}

/* ===============================================================
   INIT
   =============================================================== */
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Init UI non-data dulu (navbar, menu, dll) — tanpa intro
  initNavbar();
  initMobileMenu();
  initCatalogHint();
  initWishlistPanel();
  initFAB();
  initParallaxEffects();

  // 2. Tampilkan loading state pada grid yang ada
  const featuredGrid = document.getElementById('featured-grid');
  const catalogGrid  = document.getElementById('catalog-grid');
  const skeletonHTML = Array.from({ length: 6 }, () => `
    <div class="skeleton-card" aria-hidden="true">
      <div class="skeleton skeleton-card__img"></div>
      <div class="skeleton-card__body">
        <div class="skeleton skeleton-line skeleton-line--sm"></div>
        <div class="skeleton skeleton-line skeleton-line--lg"></div>
        <div class="skeleton skeleton-line skeleton-line--md"></div>
      </div>
    </div>`).join('');
  if (featuredGrid) featuredGrid.innerHTML = skeletonHTML;
  if (catalogGrid)  catalogGrid.innerHTML  = skeletonHTML;

  // 3. Muat data produk DULU (await), baru render
  trackPageView(document.body.dataset.page || 'site');
  try {
    await loadProducts(true);
  } catch (err) {
    console.error('Gagal memuat produk:', err);
  }

  // 4. Baru render grid setelah data siap
  initSegControl();
  initRecoSearch();
  initCategoryTriggers();
  renderRecommendations();
  syncProductCounts();   // angka kategori: 3 kursi, 3 meja, 2 sofa, 3 lemari
  renderCtaStat();

  // Auto-morph sekali: tunjukkan ada animasi, lalu kembalikan ke pilihan
  // user dan berhenti. Tidak menulis state rekomendasi.
  if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
    setTimeout(() => {
      const seg = document.getElementById('seg-control');
      const active = seg?.querySelector('.seg__btn[aria-checked="true"]');
      const other  = seg?.querySelector('.seg__btn[aria-checked="false"]');
      if (!active || !other) return;
      _suppressReco = true;
      other.click();
      setTimeout(() => { active.click(); _suppressReco = false; }, 2600);
    }, 2500);
  }

  initCatalogPage();
  try {
    await initDetailPage();
  } catch (err) {
    console.error('Gagal memuat halaman detail:', err);
  }
});
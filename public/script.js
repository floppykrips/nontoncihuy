// ── CONFIG ──
const API_KEY = '85e428c8f286893841b21eefd9cc71b5';
const BASE    = 'https://api.themoviedb.org/3';
const IMG     = 'https://image.tmdb.org/t/p/w500';
const IMG_BIG = 'https://image.tmdb.org/t/p/w1280';
const NO_IMG  = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='240' viewBox='0 0 160 240'%3E%3Crect width='160' height='240' fill='%2316161f'/%3E%3Ctext x='80' y='110' font-family='Arial' font-size='40' fill='%23555' text-anchor='middle'%3E🎬%3C/text%3E%3Ctext x='80' y='145' font-family='Arial' font-size='12' fill='%23555' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E`;

// ── CUSTOM API ──
const CUSTOM_API = '/api/films';

async function fetchCustomFilms(category) {
  try {
    const res = await fetch(`${CUSTOM_API}?category=${category}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch { return []; }
}

async function mergeCustomFilms(tmdbFilms, category) {
  const custom = await fetchCustomFilms(category);
  return [...custom, ...tmdbFilms];
}

async function getCustomFeatured() {
  try {
    const res = await fetch(`${CUSTOM_API}?category=featured`);
    if (!res.ok) return null;
    const data = await res.json();
    return (data.results || [])[0] || null;
  } catch { return null; }
}

let heroFilm    = null;
let allFilms    = {};
let currentPage = 'beranda';

// ── FETCH HELPER ──
async function fetchTMDb(path) {
  const res = await fetch(`${BASE}${path}?api_key=${API_KEY}&language=id-ID`);
  return res.json();
}

// ── LOAD SEMUA DATA ──
async function loadAll() {
  try {
    const [trending, latest, topRated, tvPop, genres] = await Promise.all([
      fetchTMDb('/trending/movie/week'),
      fetchTMDb('/movie/now_playing'),
      fetchTMDb('/movie/top_rated'),
      fetchTMDb('/tv/popular'),
      fetchTMDb('/genre/movie/list'),
    ]);

    // Merge TMDb + custom films secara paralel
    const [cTrending, cTerbaru, cTop, cSerial, cFeatured] = await Promise.all([
      fetchCustomFilms('trending'),
      fetchCustomFilms('terbaru'),
      fetchCustomFilms('top'),
      fetchCustomFilms('serial'),
      getCustomFeatured(),
    ]);

    allFilms.trending = [...cTrending, ...(trending.results || [])];
    allFilms.latest   = [...cTerbaru,  ...(latest.results   || [])];
    allFilms.top      = [...cTop,      ...(topRated.results || [])];
    allFilms.tv       = [...cSerial,   ...(tvPop.results    || [])];
    allFilms.genres   = genres.genres  || [];

    // Override hero dengan custom featured jika ada
    if (cFeatured) heroFilm = cFeatured;

    // render halaman aktif setelah data siap
    renderPage(currentPage);
  } catch (err) {
    console.error('Gagal memuat data:', err);
    renderFallback();
  }
}

// ══════════════════════════════════════════
// ── ROUTER / NAVIGATE ──
// ══════════════════════════════════════════
function navigate(page) {
  currentPage = page;

  // update active link
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });

  // scroll ke atas
  window.scrollTo({ top: 0, behavior: 'smooth' });

  renderPage(page);
  return false; // cegah reload
}

function renderPage(page) {
  const app = document.getElementById('app');

  // fade out → render → fade in
  app.classList.add('page-exit');
  setTimeout(() => {
    app.innerHTML = '';
    switch (page) {
      case 'beranda':  renderBeranda(app);  break;
      case 'trending': renderTrending(app); break;
      case 'terbaru':  renderTerbaru(app);  break;
      case 'serial':   renderSerial(app);   break;
    }
    app.classList.remove('page-exit');
    app.classList.add('page-enter');
    setTimeout(() => app.classList.remove('page-enter'), 300);
  }, 150);
}

// ══════════════════════════════════════════
// ── PAGE: BERANDA ──
// ══════════════════════════════════════════
function renderBeranda(app) {
  app.innerHTML = `
    <!-- HERO -->
    <section class="hero" id="hero">
      <div class="hero-bg" id="heroBg"></div>
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <span class="hero-badge">🎬 Featured</span>
        <h1 class="hero-title" id="heroTitle">Loading...</h1>
        <div class="hero-meta" id="heroMeta"></div>
        <p class="hero-desc" id="heroDesc">Memuat data film...</p>
        <div class="hero-btns">
          <button class="btn-play" onclick="openHeroModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
            Tonton Sekarang
          </button>
          <button class="btn-info" id="heroInfoBtn">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Info Film
          </button>
        </div>
      </div>
    </section>

    <!-- GENRE PILLS -->
    <div class="genre-pills" id="genrePills">
      <button class="pill active" data-genre="0" onclick="filterGenre(0, this)">Semua</button>
    </div>

    <!-- TRENDING -->
    ${buildSection('fire-trending', '🔥 Trending Minggu Ini', 'trending-slider')}
    <!-- TERBARU -->
    ${buildSection('sparkle-latest', '✨ Film Terbaru', 'latest-slider')}
    <!-- TOP RATED -->
    ${buildSection('star-top', '⭐ Rating Tertinggi', 'top-slider')}

    ${buildFooter()}
  `;

  // isi data
  if (allFilms.trending) {
    renderHero(allFilms.trending[0]);
    renderGenrePills(allFilms.genres);
    renderSlider('trending-slider', allFilms.trending, true);
    renderSlider('latest-slider',   allFilms.latest,   true, true);
    renderSlider('top-slider',      allFilms.top);
  } else {
    showSkeletons(['trending-slider','latest-slider','top-slider']);
  }

  setupSearch();
}

// ══════════════════════════════════════════
// ── PAGE: TRENDING ──
// ══════════════════════════════════════════
function renderTrending(app) {
  app.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">🔥 Trending</h1>
      <p class="page-sub">Film paling banyak ditonton minggu ini</p>
    </div>
    <div class="grid-section" id="trendingGrid"></div>
    ${buildFooter()}
  `;

  if (allFilms.trending) {
    renderGrid('trendingGrid', allFilms.trending, true);
  } else {
    showGridSkeleton('trendingGrid');
  }
}

// ══════════════════════════════════════════
// ── PAGE: TERBARU ──
// ══════════════════════════════════════════
function renderTerbaru(app) {
  app.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">✨ Film Terbaru</h1>
      <p class="page-sub">Tayang terbaru di bioskop</p>
    </div>
    <div class="grid-section" id="terbaruGrid"></div>
    ${buildFooter()}
  `;

  if (allFilms.latest) {
    renderGrid('terbaruGrid', allFilms.latest, false, true);
  } else {
    showGridSkeleton('terbaruGrid');
  }
}

// ══════════════════════════════════════════
// ── PAGE: SERIAL ──
// ══════════════════════════════════════════
function renderSerial(app) {
  app.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">📺 Serial Populer</h1>
      <p class="page-sub">Serial TV yang lagi hits</p>
    </div>
    <div class="grid-section" id="serialGrid"></div>
    ${buildFooter()}
  `;

  if (allFilms.tv) {
    renderGrid('serialGrid', allFilms.tv, false, false, true);
  } else {
    showGridSkeleton('serialGrid');
  }
}

// ══════════════════════════════════════════
// ── BUILD HELPERS ──
// ══════════════════════════════════════════
function buildSection(id, title, sliderId) {
  return `
    <section class="section" id="${id}">
      <div class="section-header">
        <h2 class="section-title">${title}</h2>
      </div>
      <div class="slider-wrap">
        <button class="slider-arrow left" onclick="slide('${sliderId}', -1)">‹</button>
        <div class="slider" id="${sliderId}"></div>
        <button class="slider-arrow right" onclick="slide('${sliderId}', 1)">›</button>
      </div>
    </section>`;
}

function buildFooter() {
  return `
    <footer>
      <div class="footer-brand">
        <a href="#" class="nav-logo" onclick="navigate('beranda')">NONTON<span>CIHUY</span></a>
        <p>Platform streaming film Indonesia dengan koleksi terlengkap. Nikmati film favorit kapan saja dan di mana saja.</p>
      </div>
      <div class="footer-links">
        <h4>Navigasi</h4>
        <ul>
          <li><a href="#" onclick="navigate('beranda')">Beranda</a></li>
          <li><a href="#" onclick="navigate('terbaru')">Film Terbaru</a></li>
          <li><a href="#" onclick="navigate('serial')">Serial TV</a></li>
          <li><a href="#" onclick="navigate('trending')">Trending</a></li>
        </ul>
      </div>
      <div class="footer-links">
        <h4>Genre</h4>
        <ul>
          <li><a href="#">Action</a></li>
          <li><a href="#">Komedi</a></li>
          <li><a href="#">Horor</a></li>
          <li><a href="#">Drama</a></li>
        </ul>
      </div>
      <div class="footer-links">
        <h4>Info</h4>
        <ul>
          <li><a href="#">Tentang Kami</a></li>
          <li><a href="#">Kontak</a></li>
          <li><a href="#">Kebijakan Privasi</a></li>
          <li><a href="#">Syarat Layanan</a></li>
        </ul>
      </div>
      <div class="footer-bottom">
        <span>© 2024 Nonton Film Cihuy. Dibuat untuk tugas kuliah 🎓</span>
        <span>Data film dari <a href="https://www.themoviedb.org/" target="_blank" style="color:var(--red);text-decoration:none;">TMDb</a></span>
      </div>
    </footer>`;
}

// ══════════════════════════════════════════
// ── HERO ──
// ══════════════════════════════════════════
function renderHero(film) {
  if (!film) return;
  heroFilm = film;

  document.getElementById('heroTitle').textContent =
    film.title || film.name || '–';

  document.getElementById('heroDesc').textContent =
    film.overview
      ? film.overview.slice(0, 200) + (film.overview.length > 200 ? '…' : '')
      : 'Deskripsi tidak tersedia.';

  const heroYear = film.year || film.release_date?.split('-')[0] || '–';
  const heroRating = film.vote_average || film.rating || 0;
  const heroSource = film.isCustom ? '✦ Custom' : 'TMDb';
  document.getElementById('heroMeta').innerHTML = `
    <span class="star">★ ${typeof heroRating === 'number' ? heroRating.toFixed(1) : heroRating}</span>
    <span class="dot"></span>
    <span>${heroYear}</span>
    <span class="dot"></span>
    <span>${heroSource}</span>
  `;

  // Support custom film poster/backdrop
  const bg = document.getElementById('heroBg');
  if (film.isCustom && film.poster) {
    bg.style.background = `url(${film.poster}) center/cover no-repeat`;
  } else if (film.backdrop_path) {
    bg.style.background =
      `url(${IMG_BIG}${film.backdrop_path}) center/cover no-repeat`;
  }

  document.getElementById('heroInfoBtn').onclick = () => openModal(film);
}

function openHeroModal() {
  if (heroFilm) openModal(heroFilm);
}

// ══════════════════════════════════════════
// ── GENRE PILLS ──
// ══════════════════════════════════════════
function renderGenrePills(genres) {
  const wrap = document.getElementById('genrePills');
  if (!wrap) return;
  genres.slice(0, 12).forEach(g => {
    const btn = document.createElement('button');
    btn.className     = 'pill';
    btn.textContent   = g.name;
    btn.dataset.genre = g.id;
    btn.onclick       = () => filterGenre(g.id, btn);
    wrap.appendChild(btn);
  });
}

function filterGenre(id, el) {
  document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  const src = id == 0
    ? allFilms.trending
    : allFilms.trending.filter(f => f.genre_ids?.includes(Number(id)));
  renderSlider('trending-slider', src.length ? src : allFilms.trending, true);
}

// ══════════════════════════════════════════
// ── SLIDER (beranda) ──
// ══════════════════════════════════════════
function renderSlider(id, films, badge = false, isNew = false, isTV = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = '';

  (films || []).slice(0, 20).forEach((f, i) => {
    const title  = f.title || f.name || 'Tanpa Judul';
    const poster = f.poster || (f.poster_path ? `${IMG}${f.poster_path}` : NO_IMG);
    const year   = f.year || (f.release_date || f.first_air_date || '').split('-')[0] || '–';
    const rating = (f.vote_average || f.rating || 0);
    const ratingStr = typeof rating === 'number' ? rating.toFixed(1) : (rating || '–');

    const card     = document.createElement('div');
    card.className = 'film-card';
    card.innerHTML = `
      ${isNew  && i < 5 ? '<span class="card-badge-new">Baru</span>'      : ''}
      ${badge  && i < 3 ? `<span class="card-badge-new">#${i + 1}</span>` : ''}
      <img class="card-poster" src="${poster}" alt="${title}" loading="lazy"/>
      <div class="card-overlay"><div class="play-icon">▶</div></div>
      <div class="card-info">
        <div class="card-title">${title}</div>
        <div class="card-meta">
          <span>${year}</span>
          <span class="card-rating">★ ${ratingStr}</span>
        </div>
      </div>
    `;
    card.onclick = () => openModal(f, isTV);
    el.appendChild(card);
  });
}

function slide(id, dir) {
  const el = document.getElementById(id);
  if (el) el.scrollBy({ left: dir * 520, behavior: 'smooth' });
}

// ══════════════════════════════════════════
// ── GRID (halaman penuh) ──
// ══════════════════════════════════════════
function renderGrid(id, films, badge = false, isNew = false, isTV = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = '';

  (films || []).slice(0, 20).forEach((f, i) => {
    const title  = f.title || f.name || 'Tanpa Judul';
    const poster = f.poster || (f.poster_path ? `${IMG}${f.poster_path}` : NO_IMG);
    const year   = f.year || (f.release_date || f.first_air_date || '').split('-')[0] || '–';
    const rating = (f.vote_average || f.rating || 0);
    const ratingStr = typeof rating === 'number' ? rating.toFixed(1) : (rating || '–');

    const card     = document.createElement('div');
    card.className = 'film-card grid-card';
    card.innerHTML = `
      ${isNew  && i < 5 ? '<span class="card-badge-new">Baru</span>'      : ''}
      ${badge  && i < 3 ? `<span class="card-badge-new">#${i + 1}</span>` : ''}
      <img class="card-poster" src="${poster}" alt="${title}" loading="lazy"/>
      <div class="card-overlay"><div class="play-icon">▶</div></div>
      <div class="card-info">
        <div class="card-title">${title}</div>
        <div class="card-meta">
          <span>${year}</span>
          <span class="card-rating">★ ${ratingStr}</span>
        </div>
      </div>
    `;
    card.onclick = () => openModal(f, isTV);
    el.appendChild(card);
  });
}

// ══════════════════════════════════════════
// ── MODAL ──
// ══════════════════════════════════════════
function openModal(film, isTV = false) {
  const title  = film.title || film.name || 'Film';
  const year   = (film.release_date || film.first_air_date || film.year || '').toString().split('-')[0];
  const desc   = film.overview || film.desc || 'Deskripsi tidak tersedia.';
  const rating = (film.vote_average || film.rating || 0);
  const ratingStr = typeof rating === 'number' ? rating.toFixed(1) : rating || '–';
  // Custom film uses film.poster; TMDb uses film.poster_path
  const poster = film.poster || (film.poster_path ? `${IMG}${film.poster_path}` : NO_IMG);
  const isCustom = !!film.isCustom;
  const typeLabel = isCustom ? (film.type === 'serial' ? 'Serial TV' : 'Film') : (isTV ? 'Serial TV' : 'Film');

  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalDesc').textContent  = desc;
  document.getElementById('modalMeta').innerHTML    = `
    <span class="tag">★ ${ratingStr}</span>
    <span class="tag">${year || '–'}</span>
    <span class="tag">${typeLabel}</span>
    ${isCustom ? '<span class="tag" style="color:#00c97a;border-color:#00c97a66">✦ Custom</span>' : ''}
  `;

  const wrap = document.getElementById('modalVideoWrap');

  // ── CUSTOM FILM: pakai URL video langsung ──
  if (isCustom) {
    if (film.video) {
      // Deteksi YouTube
      const ytMatch = film.video.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
      if (ytMatch) {
        wrap.innerHTML = `
          <button class="modal-close" onclick="closeModal()">✕</button>
          <iframe
            src="https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0"
            allowfullscreen allow="autoplay; encrypted-media; picture-in-picture"
            style="width:100%;height:100%;border:0;">
          </iframe>`;
      } else {
        // Link video langsung (mp4, drive, dll)
        wrap.innerHTML = `
          <button class="modal-close" onclick="closeModal()">✕</button>
          <iframe src="${film.video}" allowfullscreen allow="autoplay; encrypted-media; picture-in-picture"
            style="width:100%;height:100%;border:0;">
          </iframe>`;
      }
    } else {
      wrap.innerHTML = `
        <button class="modal-close" onclick="closeModal()">✕</button>
        <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;
                    background:#000;flex-direction:column;gap:12px;">
          <img src="${poster}" style="max-height:240px;border-radius:8px;object-fit:cover;"/>
          <div style="color:#888;font-size:.9rem;">Video belum tersedia</div>
        </div>`;
    }
    document.getElementById('modalWatchBtn').onclick = () => openModal(film, isTV);
    document.getElementById('modal').classList.add('open');
    document.body.style.overflow = 'hidden';
    return;
  }

  // ── TMDB FILM: fetch trailer seperti biasa ──
  wrap.innerHTML = `
    <button class="modal-close" onclick="closeModal()">✕</button>
    <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;
                background:#000;flex-direction:column;gap:12px;">
      <img src="${poster}" style="max-height:200px;border-radius:8px;object-fit:cover;" onerror="this.style.display='none'"/>
      <div style="color:#aaa;font-size:.9rem;">⏳ Memuat trailer...</div>
    </div>`;

  loadTrailer(film.id, isTV);

  const btn   = document.getElementById('modalWatchBtn');
  btn.onclick = () => loadTrailer(film.id, isTV);

  document.getElementById('modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

async function loadTrailer(id, isTV) {
  const wrap = document.getElementById('modalVideoWrap');
  const type = isTV ? 'tv' : 'movie';

  try {
    const data    = await fetchTMDb(`/${type}/${id}/videos`);
    const trailer =
      (data.results || []).find(v => v.type === 'Trailer' && v.site === 'YouTube')
      || (data.results || []).find(v => v.site === 'YouTube')
      || (data.results || [])[0];

    if (trailer && trailer.site === 'YouTube') {
      wrap.innerHTML = `
        <button class="modal-close" onclick="closeModal()">✕</button>
        <iframe
          src="https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0&modestbranding=1"
          allowfullscreen
          allow="autoplay; encrypted-media; picture-in-picture"
          style="width:100%;height:100%;border:0;">
        </iframe>
      `;
    } else {
      const judul    = document.getElementById('modalTitle').textContent;
      const ytSearch = `https://www.youtube.com/results?search_query=${encodeURIComponent(judul + ' official trailer')}`;
      wrap.innerHTML = `
        <button class="modal-close" onclick="closeModal()">✕</button>
        <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;
                    background:#000;flex-direction:column;gap:12px;">
          <div style="font-size:3rem;">🎬</div>
          <div style="color:#888;font-size:.9rem;">Trailer tidak tersedia di YouTube</div>
          <a href="${ytSearch}" target="_blank" style="color:var(--red);font-size:.85rem;">Cari di YouTube ↗</a>
        </div>`;
    }
  } catch (e) {
    console.error('Gagal memuat trailer:', e);
    wrap.innerHTML = `
      <button class="modal-close" onclick="closeModal()">✕</button>
      <div style="width:100%;height:100%;display:flex;align-items:center;
                  justify-content:center;background:#000;color:#888;flex-direction:column;gap:8px;">
        <div>⚠️ Gagal memuat trailer</div>
        <div style="font-size:.8rem;color:#666;">Periksa koneksi internet kamu</div>
      </div>`;
  }
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
  document.getElementById('modalVideoWrap').innerHTML =
    `<button class="modal-close" onclick="closeModal()">✕</button>`;
  document.body.style.overflow = '';
}

function closeModalOutside(e) {
  if (e.target === document.getElementById('modal')) closeModal();
}

// ══════════════════════════════════════════
// ── SEARCH ──
// ══════════════════════════════════════════
function setupSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;
  input.addEventListener('input', async function () {
    const q = this.value.trim();
    if (q.length < 2) {
      renderSlider('trending-slider', allFilms.trending, true);
      return;
    }
    const data = await fetch(
      `${BASE}/search/movie?api_key=${API_KEY}&language=id-ID&query=${encodeURIComponent(q)}`
    ).then(r => r.json());
    renderSlider('trending-slider', data.results || []);
  });
}

// ══════════════════════════════════════════
// ── SKELETON ──
// ══════════════════════════════════════════
function showSkeletons(ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '';
    for (let i = 0; i < 8; i++) {
      el.innerHTML += `
        <div class="skeleton">
          <div class="skeleton-poster"></div>
          <div class="skeleton-info">
            <div class="skeleton-line" style="width:80%"></div>
            <div class="skeleton-line" style="width:50%"></div>
          </div>
        </div>`;
    }
  });
}

function showGridSkeleton(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = '';
  for (let i = 0; i < 20; i++) {
    el.innerHTML += `
      <div class="skeleton grid-card">
        <div class="skeleton-poster"></div>
        <div class="skeleton-info">
          <div class="skeleton-line" style="width:80%"></div>
          <div class="skeleton-line" style="width:50%"></div>
        </div>
      </div>`;
  }
}

// ── FALLBACK ──
function renderFallback() {
  const films = [
    { id: 1, title: 'Film Demo 1', vote_average: 8.5, release_date: '2024-01-01', overview: 'Demo film pertama.' },
    { id: 2, title: 'Film Demo 2', vote_average: 7.9, release_date: '2024-02-15', overview: 'Demo film kedua.' },
    { id: 3, title: 'Film Demo 3', vote_average: 9.1, release_date: '2024-03-10', overview: 'Rating tertinggi.' },
  ];
  allFilms = { trending: films, latest: films, top: films, tv: films, genres: [] };
  renderPage(currentPage);
}

// ── INIT ──
renderPage('beranda');   // render shell dulu dengan skeleton
loadAll();               // lalu fetch data

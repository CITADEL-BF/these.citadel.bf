/* ── Accordeon publications ── */
function togglePub(header) {
  const body = header.nextElementSibling;
  const btn  = header.querySelector('.pub-toggle');
  const isOpen = body.classList.contains('open');

  // fermer tous
  document.querySelectorAll('.pub-body').forEach(b => b.classList.remove('open'));
  document.querySelectorAll('.pub-toggle').forEach(b => b.textContent = '▼');

  if (!isOpen) {
    body.classList.add('open');
    btn.textContent = '▲';
  }
}

/* Menu hamburger mobile */
function toggleMenu() {
  const nav = document.getElementById('mainNav');
  const btn = document.querySelector('.menu-toggle');
  if (!nav || !btn) return;
  nav.classList.toggle('open');
  btn.classList.toggle('active');
}

// Fermer le menu au clic sur un lien
document.addEventListener('click', (e) => {
  if (e.target.closest('#mainNav a')) {
    const nav = document.getElementById('mainNav');
    const btn = document.querySelector('.menu-toggle');
    if (nav) nav.classList.remove('open');
    if (btn) btn.classList.remove('active');
  }
});

/* ── Compteur anime ── */
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  if (target === 0) { el.textContent = '0'; return; }
  const duration = 1400;
  const step = Math.ceil(target / (duration / 16));
  let current = 0;
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(timer);
  }, 16);
}

/* ── Dropdown categories ── */
function toggleDropdown() {
  const opts   = document.getElementById('selectOptions');
  const arrow  = document.getElementById('selectArrow');
  const sel    = document.querySelector('.select-selected');
  const isOpen = opts.classList.contains('open');

  opts.classList.toggle('open', !isOpen);
  arrow.classList.toggle('rotated', !isOpen);
  sel.classList.toggle('open', !isOpen);
}

function selectCategory(e, name) {
  e.stopPropagation();
  document.getElementById('selectLabel').textContent = name;
  document.getElementById('selectOptions').classList.remove('open');
  document.getElementById('selectArrow').classList.remove('rotated');
  document.querySelector('.select-selected').classList.remove('open');
  document.querySelectorAll('.select-options li').forEach(li => li.classList.remove('selected'));
  e.currentTarget.classList.add('selected');

  // Filtrer les publications par type
  filterPublications(name);
}

// Fermer si clic ailleurs
document.addEventListener('click', (e) => {
  const select = document.getElementById('categorySelect');
  if (select && !select.contains(e.target)) {
    document.getElementById('selectOptions').classList.remove('open');
    document.getElementById('selectArrow').classList.remove('rotated');
    document.querySelector('.select-selected').classList.remove('open');
  }
});

/* ── Recherche ── */
const searchBtn = document.querySelector('.search-bar button');
const searchInput = document.querySelector('.search-bar input');

if (searchBtn) {
  searchBtn.addEventListener('click', () => {
    const val = searchInput.value.trim();
    if (val) window.location.href = 'pages/publications.html?q=' + encodeURIComponent(val);
  });
}

if (searchInput) {
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') searchBtn.click();
  });
}

/* ── Variables globales ── */
let allPublications = [];

/* ── Chargement dynamique des publications depuis le JSON ── */
document.addEventListener('DOMContentLoaded', () => {
  fetch('data/publications.json')
    .then(res => res.json())
    .then(pubs => {
      allPublications = pubs;

      // ── Mettre a jour les statistiques dynamiquement ──
      const pubCount = pubs.length;

      // Compter les auteurs uniques
      const authorNames = new Set();
      pubs.forEach(p => {
        if (p.authors) {
          p.authors.forEach(a => authorNames.add(a.name));
        }
      });
      const authorCount = authorNames.size;

      // Mettre a jour les data-target des compteurs
      document.querySelectorAll('.stat-num[data-target]').forEach(el => {
        const label = el.nextElementSibling;
        if (label) {
          const labelText = label.textContent.trim().toLowerCase();
          if (labelText === 'publications') {
            el.dataset.target = pubCount;
          }
          if (labelText === 'auteurs') {
            el.dataset.target = authorCount;
          }
        }
      });

      // ── Lancer les compteurs animes apres la mise a jour ──
      const observer = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            animateCounter(e.target);
            observer.unobserve(e.target);
          }
        });
      }, { threshold: 0.5 });

      document.querySelectorAll('.stat-num[data-target]').forEach(el => observer.observe(el));

      // ── Afficher les publications ──
      renderPublications(pubs);
    })
    .catch(err => {
      console.warn('publications.json non trouve, les publications statiques du HTML seront utilisees.', err);

      // Lancer les compteurs meme si le JSON echoue
      const observer = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            animateCounter(e.target);
            observer.unobserve(e.target);
          }
        });
      }, { threshold: 0.5 });

      document.querySelectorAll('.stat-num[data-target]').forEach(el => observer.observe(el));
    });
});

/* ── Rendu des publications ── */
function renderPublications(pubs) {
  const list = document.getElementById('pub-list');
  if (!list) return;

  list.innerHTML = '';

  pubs.forEach((pub) => {
    const isFeatured = pub.featured || false;
    const dotColor   = isFeatured ? 'var(--red)' : 'var(--green)';
    const btnColor   = isFeatured ? 'var(--red)' : 'var(--green)';
    const labelColor = isFeatured ? 'var(--red)' : 'var(--green)';
    const openClass  = isFeatured ? ' open' : '';
    const authorNames = pub.authors ? pub.authors.map(a => a.name).join(', ') : '';

    const item = document.createElement('div');
    item.className = 'pub-item';
    if (isFeatured) item.id = 'featured-pub';

    item.innerHTML = `
      <div class="pub-header" onclick="togglePub(this)">
        <div class="pub-dot" style="background:${dotColor}"></div>
        <span class="pub-title">${pub.title}</span>
        <span class="pub-meta">${authorNames}, ${pub.date}</span>
        <button class="pub-toggle" style="background:${btnColor}">${isFeatured ? '▲' : '▼'}</button>
      </div>
      <div class="pub-body${openClass}">
        <span class="pub-abstract-label" style="background:${labelColor}">Abstract</span>
        <p class="pub-abstract-text">${pub.abstract}</p>
        <a class="btn-pdf" href="${pub.pdf_url || '#'}">📄 PDF</a>
      </div>
    `;

    list.appendChild(item);
  });
}

/* ── Filtrer les publications par type ── */
function filterPublications(type) {
  const typeMap = {
    'Articles': 'Article',
    'Theses': 'These',
    'Thèses': 'Thèse',
    'Memoires': 'Memoire',
    'Mémoires': 'Mémoire',
    'Rapports': 'Rapport',
    'Posters': 'Poster',
    'Conferences': 'Conférence',
    'Conférences': 'Conférence'
  };

  const filterType = typeMap[type];
  if (!filterType) return;

  const filtered = allPublications.filter(p => p.type === filterType);
  renderPublications(filtered);
}
// Icone profil navbar
if (typeof netlifyIdentity !== "undefined") {
  netlifyIdentity.on("init", user => {
    const btn = document.getElementById("btnConnexion");
    if (btn && user) {
      btn.innerHTML = `<i class="fa-solid fa-circle-user" style="font-size:1.6rem;"></i>`;
      btn.style.background = "var(--green)";
      btn.style.padding = "5px 12px";
    }
  });
}
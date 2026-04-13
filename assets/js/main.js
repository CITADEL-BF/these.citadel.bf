/* ══════════════════════════════════════════
   main.js – these.citadel.bf
   ══════════════════════════════════════════ */

/* ── Accordéon publications ── */
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

/* ── Compteur animé ── */
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1400;
  const step = Math.ceil(target / (duration / 16));
  let current = 0;
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(timer);
  }, 16);
}

const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      animateCounter(e.target);
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-num[data-target]').forEach(el => observer.observe(el));

/* ── Dropdown catégories ── */
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
}

// Fermer si clic ailleurs
document.addEventListener('click', (e) => {
  const select = document.getElementById('categorySelect');
  if (!select.contains(e.target)) {
    document.getElementById('selectOptions').classList.remove('open');
    document.getElementById('selectArrow').classList.remove('rotated');
    document.querySelector('.select-selected').classList.remove('open');
  }
});

/* ── Recherche ── */
document.querySelector('.search-bar button').addEventListener('click', () => {
  const val = document.querySelector('.search-bar input').value.trim();
  if (val) alert(`Recherche : "${val}" — connectez le backend ici.`);
});

document.querySelector('.search-bar input').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.querySelector('.search-bar button').click();
});

/* ── Chargement dynamique des publications depuis le JSON ── */
document.addEventListener('DOMContentLoaded', () => {
  fetch('data/publications.json')
    .then(res => res.json())
    .then(pubs => {
      const list = document.getElementById('pub-list');
      if (!list) return;

      list.innerHTML = '';

      pubs.forEach((pub, i) => {
        const isFeatured = pub.featured || false;
        const dotColor   = isFeatured ? 'var(--red)' : 'var(--green)';
        const btnColor   = isFeatured ? 'var(--red)' : 'var(--green)';
        const labelColor = isFeatured ? 'var(--red)' : 'var(--green)';
        const openClass  = isFeatured ? ' open' : '';

        const item = document.createElement('div');
        item.className = 'pub-item';
        if (isFeatured) item.id = 'featured-pub';

        item.innerHTML = `
          <div class="pub-header" onclick="togglePub(this)">
            <div class="pub-dot" style="background:${dotColor}"></div>
            <span class="pub-title">${pub.title}</span>
            <span class="pub-meta">${pub.author}, ${pub.date}</span>
            <button class="pub-toggle" style="background:${btnColor}">${isFeatured ? '▲' : '▼'}</button>
          </div>
          <div class="pub-body${openClass}">
            <span class="pub-abstract-label" style="background:${labelColor}">Abstract</span>
            <p class="pub-abstract-text">${pub.abstract}</p>
            <a class="btn-pdf" href="${pub.pdf || '#'}">📄 PDF</a>
          </div>
        `;

        list.appendChild(item);
      });
    })
    .catch(err => {
      console.warn('publications.json non trouvé, les publications statiques du HTML seront utilisées.', err);
    });
});
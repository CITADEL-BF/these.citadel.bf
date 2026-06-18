let allPubs = [], filtered = [], currentPage = 1, perPage = 10, currentType = '';

// Compteur d'ID pour affichage
function getPubId(index) {
  const num = String(index + 1).padStart(3, '0');
  return `CIT-${new Date().getFullYear()}-${num}`;
}

// Couleurs par thème
const themeColors = {
  'LANGUE & PATRIMOINE':              { bg: '#EDE9FE', color: '#6D28D9' },
  'SANTÉ & BIEN-ÊTRE':                { bg: '#D1FAE5', color: '#065F46' },
  'AGRICULTURE ET PASTORALISME':      { bg: '#FEF3C7', color: '#92400E' },
  'FINTECH & SÉCURITÉ':               { bg: '#DBEAFE', color: '#1E40AF' },
  'CONFIDENTIALITÉ ET EXPLICABILITÉ': { bg: '#FCE7F3', color: '#9D174D' },
  'ÉNERGIE ET CHANGEMENT CLIMATIQUE': { bg: '#D1FAE5', color: '#065F46' },
};

const typeColors = {
  'Article':    { bg: '#FEE2E2', color: '#991B1B' },
  'Thèse':      { bg: '#D1FAE5', color: '#065F46' },
  'Conférence': { bg: '#DBEAFE', color: '#1E40AF' },
  'Rapport':    { bg: '#FEF3C7', color: '#92400E' },
  'Poster':     { bg: '#F3E8FF', color: '#6B21A8' },
  'Mémoire':    { bg: '#CCFBF1', color: '#0F766E' },
};

Promise.all([
  fetch('../data/publications.json').then(r => r.json()).catch(() => []),
  fetch(`${SUPABASE_URL}/rest/v1/publications?select=*&status=eq.Publié&order=created_at.desc`, {
    headers: {
      "apikey": SUPABASE_ANON,
      "Authorization": `Bearer ${SUPABASE_ANON}`
    }
  }).then(r => r.json()).catch(() => [])
]).then(([jsonPubs, supaPubs]) => {
  allPubs = [...supaPubs, ...jsonPubs];
  const urlParams = new URLSearchParams(window.location.search);
  const typeParam = urlParams.get('type');
  if (typeParam) {
    currentType = typeParam;
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.remove('active');
      if (t.dataset.type === typeParam) t.classList.add('active');
    });
    if (typeParam === 'Thèse') {
      document.querySelectorAll('.navbar nav a').forEach(a => {
        a.classList.remove('active');
        if (a.textContent.trim() === 'Thèses') a.classList.add('active');
      });
    }
  }

  const saved = sessionStorage.getItem('pubState');
  if (saved && !typeParam) {
    const s = JSON.parse(saved);
    currentType  = s.type  || '';
    currentPage  = s.page  || 1;
    searchInput.value    = s.q      || '';
    filterYear.value     = s.year   || '';
    filterAuthor.value   = s.author || '';
    filterType.value     = s.ftype  || '';
    filterTheme.value    = s.theme  || '';
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.remove('active');
      if (t.dataset.type === currentType) t.classList.add('active');
      if (!currentType && t.dataset.type === '') t.classList.add('active');
    });
  }

  populateFilters();
  applyFilters(true);
});

function saveState() {
  sessionStorage.setItem('pubState', JSON.stringify({
    type: currentType,
    year: filterYear.value,
    author: filterAuthor.value,
    ftype: filterType.value,
    theme: filterTheme.value,
    q: searchInput.value.trim(),
    page: currentPage
  }));
}

function populateFilters() {
  const years = [...new Set(allPubs.map(p => p.year))].sort((a,b) => b-a);
  const authors = [...new Set(allPubs.map(p => p.authors || ''))];
  const themes = [...new Set(allPubs.map(p => p.theme))];
  years.forEach(y => filterYear.innerHTML += `<option value="${y}">${y}</option>`);
  authors.forEach(a => filterAuthor.innerHTML += `<option value="${a}">${a}</option>`);
  ['Article','Thèse','Rapport','Poster','Mémoire'].forEach(t => filterType.innerHTML += `<option value="${t}">${t}</option>`);
  themes.forEach(t => filterTheme.innerHTML += `<option value="${t}">${t}</option>`);

  const saved = sessionStorage.getItem('pubState');
  if (saved) {
    const s = JSON.parse(saved);
    filterYear.value   = s.year   || '';
    filterAuthor.value = s.author || '';
    filterType.value   = s.ftype  || '';
    filterTheme.value  = s.theme  || '';
  }
}

function applyFilters(keepPage = false) {
  if (!keepPage) currentPage = 1;
  const q = searchInput.value.trim();
  let res = allPubs;
  if (currentType) res = res.filter(p => p.type === currentType);
  if (filterYear.value) res = res.filter(p => p.year == filterYear.value);
  if (filterAuthor.value) res = res.filter(p => p.authors && p.authors.includes(filterAuthor.value));
  if (filterType.value) res = res.filter(p => p.type === filterType.value);
  if (filterTheme.value) res = res.filter(p => p.theme === filterTheme.value);
  if (q) {
    const fuse = new Fuse(res, { keys: ['title','abstract','keywords','authors.name'], threshold: 0.4 });
    res = fuse.search(q).map(r => r.item);
  }
  filtered = res;
  saveState();
  render();
}

function render() {
  resultCount.textContent = filtered.length;
  const start = (currentPage - 1) * perPage;
  const pageItems = filtered.slice(start, start + perPage);

  pubResults.innerHTML = pageItems.map((p, i) => {
    const authors = Array.isArray(p.authors) ? p.authors.map(a => a.name).join(', ') : (p.authors || '');
    const globalIndex = start + i;

    // Couleur du badge thème ou type
    const themeStyle = themeColors[p.theme] || typeColors[p.type] || { bg: '#F3F4F6', color: '#374151' };
    const typeStyle  = typeColors[p.type]   || { bg: '#F3F4F6', color: '#374151' };

    const pubId = `CIT-${p.year || new Date().getFullYear()}-${String(globalIndex + 1).padStart(3, '0')}`;

  return `
      <div class="pub-card-new">
        <div class="pub-card-top" onclick="togglePubCard(this)">
          <div class="pub-card-badges">
            <span class="pub-theme-badge" style="background:${(typeColors[p.type]||{bg:'#F3F4F6'}).bg};color:${(typeColors[p.type]||{color:'#374151'}).color}">${p.type}</span>
          </div>
          <i class="fa-solid fa-chevron-down pub-chevron" style="color:var(--green)"></i>
        </div>
        <div class="pub-card-middle" onclick="togglePubCard(this.previousElementSibling)">
          <div class="pub-card-title-new">${p.title}</div>
          <div class="pub-card-meta-new">
            <span><i class="fa-regular fa-user"></i> ${authors.split(',')[0].trim()}${authors.split(',').length > 1 ? ' et al.' : ''}</span>
            <span><i class="fa-regular fa-calendar"></i> ${p.year}</span>
            ${p.theme ? `<span><i class="fa-solid fa-microscope"></i> ${p.theme}</span>` : ''}
          </div>
        </div>
        <div class="pub-card-body-new">
          <p class="pub-abstract-text">${p.abstract}</p>
          ${p.keywords ? `<p style="font-size:.8rem;color:var(--gray);margin-top:8px"><strong>Mots-clés :</strong> ${p.keywords}</p>` : ''}
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
            ${p.pdf_url ? `<a class="btn-pdf" href="${p.pdf_url}" target="_blank"><i class="fa-regular fa-file-pdf"></i> PDF</a>` : ''}
            <a class="btn-pdf" href="detail.html?id=${p.id}" style="background:var(--green-pale);color:var(--green);border-color:rgba(0,102,51,.2)"><i class="fa-solid fa-arrow-up-right-from-square"></i> Détails</a>
          </div>
        </div>
      </div>`;
  }).join('');

  renderPagination();
}

function renderPagination() {
  const pages = Math.ceil(filtered.length / perPage);
  pagination.innerHTML = '';
  for (let i = 1; i <= pages; i++) {
    pagination.innerHTML += `<button class="${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }
}

function goToPage(i) {
  currentPage = i;
  saveState();
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function togglePubCard(topEl) {
  const card = topEl.closest('.pub-card-new');
  const body = card.querySelector('.pub-card-body-new');
  const chevron = card.querySelector('.pub-chevron');
  body.classList.toggle('open');
  chevron.style.transform = body.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0deg)';
}

// Compatibilité avec les anciens boutons déplier/replier
function togglePub(h) {
  const body = h.nextElementSibling;
  body.classList.toggle('open');
  const btn = h.querySelector('.pub-toggle');
  if (btn) btn.textContent = body.classList.contains('open') ? '▲' : '▼';
}

searchInput.addEventListener('input', () => applyFilters(false));
[filterYear, filterAuthor, filterType, filterTheme].forEach(s => s.addEventListener('change', () => applyFilters(false)));
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
  t.classList.add('active');
  currentType = t.dataset.type;
  applyFilters(false);
}));
expandAll.addEventListener('click', () => {
  document.querySelectorAll('.pub-card-body-new').forEach(b => b.classList.add('open'));
  document.querySelectorAll('.pub-chevron').forEach(c => c.style.transform = 'rotate(180deg)');
});
collapseAll.addEventListener('click', () => {
  document.querySelectorAll('.pub-card-body-new').forEach(b => b.classList.remove('open'));
  document.querySelectorAll('.pub-chevron').forEach(c => c.style.transform = 'rotate(0deg)');
});
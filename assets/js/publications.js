let allPubs = [], filtered = [], currentPage = 1, perPage = 5, currentType = '';

fetch(`${SUPABASE_URL}/rest/v1/publications?select=*&order=created_at.desc`, {
  headers: {
    "apikey": SUPABASE_ANON,
    "Authorization": `Bearer ${SUPABASE_ANON}`
  }
}).then(r => r.json()).then(data => {
  allPubs = data;
  // Lire le paramètre ?type= dans l'URL
      const urlParams = new URLSearchParams(window.location.search);
      const typeParam = urlParams.get('type');
      if (typeParam) {
        currentType = typeParam;
        // Activer l'onglet correspondant
        document.querySelectorAll('.tab').forEach(t => {
          t.classList.remove('active');
          if (t.dataset.type === typeParam) t.classList.add('active');
        });
      }
      // Déplacer le soulignement vert dans la navbar
      if (typeParam === 'Thèse') {
        document.querySelectorAll('.navbar nav a').forEach(a => {
          a.classList.remove('active');
          if (a.textContent.trim() === 'Thèses') a.classList.add('active');
        });
      }
  populateFilters();
  applyFilters();
});

function populateFilters() {
  const years = [...new Set(allPubs.map(p => p.year))].sort((a,b) => b-a);
  const authors = [...new Set(allPubs.map(p => p.authors || ''))];
  const themes = [...new Set(allPubs.map(p => p.theme))];
  years.forEach(y => filterYear.innerHTML += `<option value="${y}">${y}</option>`);
  authors.forEach(a => filterAuthor.innerHTML += `<option value="${a}">${a}</option>`);
  ['Article','Thèse','Rapport','Poster','Mémoire'].forEach(t => filterType.innerHTML += `<option value="${t}">${t}</option>`);
  themes.forEach(t => filterTheme.innerHTML += `<option value="${t}">${t}</option>`);
}

function applyFilters() {
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
  currentPage = 1;
  render();
}

function render() {
  resultCount.textContent = filtered.length;
  const start = (currentPage-1) * perPage;
  const pageItems = filtered.slice(start, start + perPage);
  pubResults.innerHTML = pageItems.map(p => `
    <div class="pub-item">
      <div class="pub-header" onclick="togglePub(this)">
        <div style="flex:1">
          <span class="pub-type-badge ${p.type.toLowerCase()}">${p.type}</span>
          <div class="pub-title">${p.title}</div>
          <span class="pub-meta">${p.authors || ''} • ${p.year}</span>
        </div>
        <button class="pub-toggle">▼</button>
      </div>
      <div class="pub-body">
        <span class="pub-abstract-label">Abstract</span>
        <p class="pub-abstract-text">${p.abstract}</p>
        <p style="font-size:.8rem;color:var(--gray)"><strong>Keywords:</strong> ${p.keywords || ''}</p>
        <a class="btn-pdf" href="${p.pdf_url}">📄 PDF</a>
        <a class="btn-pdf" href="detail.html?id=${p.id}" style="background:#e3f2fd;color:#1565c0;border-color:#90caf9">🔗 Détails</a>
      </div>
    </div>`).join('');
  renderPagination();
}

function renderPagination() {
  const pages = Math.ceil(filtered.length / perPage);
  pagination.innerHTML = '';
  for (let i = 1; i <= pages; i++) {
    pagination.innerHTML += `<button class="${i===currentPage?'active':''}" onclick="currentPage=${i};render()">${i}</button>`;
  }
}

function togglePub(h) {
  const body = h.nextElementSibling;
  body.classList.toggle('open');
  h.querySelector('.pub-toggle').textContent = body.classList.contains('open') ? '▲' : '▼';
}

searchInput.addEventListener('input', applyFilters);
[filterYear, filterAuthor, filterType, filterTheme].forEach(s => s.addEventListener('change', applyFilters));
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
  t.classList.add('active');
  currentType = t.dataset.type;
  applyFilters();
}));
expandAll.addEventListener('click', () => document.querySelectorAll('.pub-body').forEach(b => b.classList.add('open')));
collapseAll.addEventListener('click', () => document.querySelectorAll('.pub-body').forEach(b => b.classList.remove('open')));
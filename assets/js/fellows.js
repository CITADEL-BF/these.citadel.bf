let fellowsData = [];
let pubsData = [];

function countPubs(fellow) {
  return pubsData.filter(p =>
    p.submitted_by && p.submitted_by.toLowerCase() === fellow.email.toLowerCase()
  ).length;
}

// Charger les données depuis Supabase
Promise.all([
  supabaseFetch("fellows?select=*").catch(() => []),
  supabaseFetch("publications?select=*").catch(() => []),
  fetch('../data/publications.json').then(r => r.json()).catch(() => []),
  fetch('../data/fellows.json').then(r => r.json()).catch(() => [])
]).then(([supaFellows, supaPubs, jsonPubs, jsonFellows]) => {
  fellowsData = [...jsonFellows, ...supaFellows];
  pubsData = [...jsonPubs, ...supaPubs];

  const params = new URLSearchParams(window.location.search);
  const fellowId = params.get('id');

  if (fellowId) {
    showProfile(fellowId);
  } else {
    showGrid();
  }
}).catch(err => {
  console.error("Erreur chargement:", err);
});

function showGrid() {
  document.getElementById('fellowsGrid').style.display = 'block';
  document.getElementById('fellowProfile').style.display = 'none';

  const params = new URLSearchParams(window.location.search);
  const roleParam = params.get('role');

  let displayedFellows = fellowsData;
  let pageTitle = 'Nos Fellows';

  if (roleParam === 'directeur') {
    displayedFellows = fellowsData.filter(f => f.title && f.title.toLowerCase().includes('directeur'));
    pageTitle = 'Directeurs de Recherche';
  } else if (roleParam === 'senior') {
    displayedFellows = fellowsData.filter(f => f.title && f.title.toLowerCase().includes('senior'));
    pageTitle = 'Chercheurs Seniors';
  } else if (roleParam === 'fellow') {
    displayedFellows = fellowsData.filter(f => f.title && f.title.toLowerCase().includes('fellow'));
    pageTitle = 'Fellows CITADEL';
  }

  const heroTitle = document.querySelector('.hero h1');
  if (heroTitle) heroTitle.textContent = pageTitle;

  const container = document.getElementById('gridContainer');

  if (displayedFellows.length === 0) {
    container.innerHTML = '<p style="text-align:center;padding:40px;color:#999;font-style:italic;">Aucun membre trouvé dans cette catégorie.</p>';
    return;
  }

  container.innerHTML = displayedFellows.map(f => {
    const photoHtml = f.photo
      ? `<img src="${f.photo}" alt="${f.name}" />`
      : `<i class="fa-solid fa-user placeholder-avatar"></i>`;

    const themes = typeof f.themes === 'string' ? f.themes.split(',').map(t => t.trim()) : (f.themes || []);

    return `
      <div class="fellow-card" onclick="navigateToFellow('${f.id}')">
        <div class="fellow-card-photo">${photoHtml}</div>
        <div class="fellow-card-body">
          <div class="fellow-card-name">${f.name}</div>
          <div class="fellow-card-title">${f.title || ""}</div>
          <div class="fellow-card-themes">
            ${themes.map(t => `<span class="fellow-theme-tag">${t}</span>`).join('')}
          </div>
          <div class="fellow-card-stats">
            <i class="fa-solid fa-file-lines"></i>
            ${countPubs(f)} publication(s)
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function navigateToFellow(id) {
  window.history.pushState({}, '', `fellows.html?id=${id}`);
  showProfile(id);
}

function showProfile(id) {
  const fellow = fellowsData.find(f => f.id == id);
  if (!fellow) return;

  document.getElementById('fellowsGrid').style.display = 'none';
  document.getElementById('fellowProfile').style.display = 'block';

  const fellowPubs = pubsData.filter(p =>
    p.submitted_by && p.submitted_by.toLowerCase() === fellow.email.toLowerCase()
  );

  const photoHtml = fellow.photo
    ? `<img src="${fellow.photo}" alt="${fellow.name}" />`
    : `<i class="fa-solid fa-user" style="font-size:48px;color:rgba(255,255,255,.5)"></i>`;

  const badgeColors = {
    'Article': '#F94722',
    'Thèse': '#00A550',
    'Conférence': '#1565c0',
    'Rapport': '#f0a500',
    'Poster': '#8e24aa',
    'Mémoire': '#00897b'
  };

  const themes = typeof fellow.themes === 'string' ? fellow.themes.split(',').map(t => t.trim()) : (fellow.themes || []);

  const pubsHtml = fellowPubs.length > 0
    ? fellowPubs.map(p => `
        <a class="profile-pub-item" href="detail.html?id=${p.id}">
          <span class="profile-pub-badge" style="background:${badgeColors[p.type] || '#555'}">${p.type}</span>
          <span class="profile-pub-title">${p.title}</span>
          <span class="profile-pub-year">${p.year}</span>
        </a>
      `).join('')
    : '<p class="no-pubs">Aucune publication trouvée pour ce Fellow.</p>';

  document.getElementById('profileContent').innerHTML = `
    <a class="profile-back" onclick="backToGrid()">
      <i class="fa-solid fa-arrow-left"></i> Retour aux Fellows
    </a>
    <div class="profile-card">
      <div class="profile-header">
        <div class="profile-photo">${photoHtml}</div>
        <div class="profile-info">
          <h1>${fellow.name}</h1>
          <div class="profile-title">${fellow.title || ""}</div>
          <div class="profile-email"><i class="fa-solid fa-envelope"></i>${fellow.email}</div>
        </div>
      </div>
      <div class="profile-body">
        <div class="profile-section">
          <h2>Biographie</h2>
          <p class="profile-bio">${fellow.bio || ""}</p>
        </div>
        <div class="profile-section">
          <h2>Axes de recherche</h2>
          <div class="profile-themes">
            ${themes.map(t => `<span class="profile-theme-tag">${t}</span>`).join('')}
          </div>
        </div>
        <div class="profile-section">
          <h2>Publications (${fellowPubs.length})</h2>
          <div class="profile-pubs-list">${pubsHtml}</div>
        </div>
      </div>
    </div>
  `;

  window.scrollTo(0, 0);
}

function backToGrid() {
  window.history.pushState({}, '', 'fellows.html');
  showGrid();
  window.scrollTo(0, 0);
}

window.addEventListener('popstate', () => {
  const params = new URLSearchParams(window.location.search);
  const fellowId = params.get('id');
  if (fellowId) {
    showProfile(fellowId);
  } else {
    showGrid();
  }
});
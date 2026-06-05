let fellowsData = [];
let pubsData = [];
function countPubs(fellow) {
  return pubsData.filter(p =>
    (p.submitted_by && p.submitted_by.toLowerCase() === fellow.email.toLowerCase()) ||
    p.authors.some(a =>
      a.name.toLowerCase().includes(fellow.name.split(' ').pop().toLowerCase()) ||
      fellow.name.toLowerCase().includes(a.name.split(' ').pop().toLowerCase())
    )
  ).length;
}

// Charger les deux JSON
Promise.all([
  fetch('../data/fellows.json').then(r => r.json()),
  fetch('../data/publications.json').then(r => r.json())
]).then(([fellows, pubs]) => {
  fellowsData = fellows;
  pubsData = pubs;

  // Verifier si un profil est demande via l'URL
  const params = new URLSearchParams(window.location.search);
  const fellowId = params.get('id');

  if (fellowId) {
    showProfile(fellowId);
  } else {
    showGrid();
  }
});

function showGrid() {
  document.getElementById('fellowsGrid').style.display = 'block';
  document.getElementById('fellowProfile').style.display = 'none';

  // Lire le parametre ?role= dans l'URL
  const params = new URLSearchParams(window.location.search);
  const roleParam = params.get('role');

  // Filtrer les fellows par role si un parametre est present
  let displayedFellows = fellowsData;
  let pageTitle = 'Nos Fellows';

  if (roleParam === 'directeur') {
    displayedFellows = fellowsData.filter(f => f.role === 'directeur');
    pageTitle = 'Directeurs de Recherche';
  } else if (roleParam === 'senior') {
    displayedFellows = fellowsData.filter(f => f.role === 'senior');
    pageTitle = 'Chercheurs Seniors';
  } else if (roleParam === 'fellow') {
    displayedFellows = fellowsData.filter(f => f.role === 'fellow');
    pageTitle = 'Fellows CITADEL';
  }

  // Mettre a jour le titre du hero
  const heroTitle = document.querySelector('.hero h1');
  if (heroTitle) heroTitle.textContent = pageTitle;

  // Mettre a jour le soulignement navbar
  if (roleParam) {
    document.querySelectorAll('.navbar nav > a, .navbar nav .nav-dropdown > a').forEach(a => {
      a.classList.remove('active');
      if (a.textContent.trim().startsWith('Fellows')) a.classList.add('active');
    });
  }

  const container = document.getElementById('gridContainer');
  
  if (displayedFellows.length === 0) {
    container.innerHTML = '<p style="text-align:center;padding:40px;color:#999;font-style:italic;">Aucun membre trouve dans cette categorie.</p>';
    return;
  }

  container.innerHTML = displayedFellows.map(f => {
    const photoHtml = f.photo
      ? `<img src="${f.photo}" alt="${f.name}" />`
      : `<i class="fa-solid fa-user placeholder-avatar"></i>`;

    return `
      <div class="fellow-card" onclick="navigateToFellow('${f.id}')">
        <div class="fellow-card-photo">${photoHtml}</div>
        <div class="fellow-card-body">
          <div class="fellow-card-name">${f.name}</div>
          <div class="fellow-card-title">${f.title}</div>
          <div class="fellow-card-themes">
            ${f.themes.map(t => `<span class="fellow-theme-tag">${t}</span>`).join('')}
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
  const fellow = fellowsData.find(f => f.id === id);
  if (!fellow) return;

  document.getElementById('fellowsGrid').style.display = 'none';
  document.getElementById('fellowProfile').style.display = 'block';

  // Activer le soulignement navbar
  document.querySelectorAll('.navbar nav a').forEach(a => {
    a.classList.remove('active');
    if (a.textContent.trim() === 'Fellows') a.classList.add('active');
  });

  // Trouver les publications de ce fellow
  const fellowPubs = pubsData.filter(p =>
  (p.submitted_by && p.submitted_by.toLowerCase() === fellow.email.toLowerCase()) ||
  p.authors.some(a =>
    a.name.toLowerCase().includes(fellow.name.split(' ').pop().toLowerCase()) ||
    fellow.name.toLowerCase().includes(a.name.split(' ').pop().toLowerCase())
  )
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

  const pubsHtml = fellowPubs.length > 0
    ? fellowPubs.map(p => `
        <a class="profile-pub-item" href="detail.html?id=${p.id}">
          <span class="profile-pub-badge" style="background:${badgeColors[p.type] || '#555'}">${p.type}</span>
          <span class="profile-pub-title">${p.title}</span>
          <span class="profile-pub-year">${p.year}</span>
        </a>
      `).join('')
    : '<p class="no-pubs">Aucune publication trouvee pour ce Fellow.</p>';

  document.getElementById('profileContent').innerHTML = `
    <a class="profile-back" onclick="backToGrid()">
      <i class="fa-solid fa-arrow-left"></i> Retour aux Fellows
    </a>
    <div class="profile-card">
      <div class="profile-header">
        <div class="profile-photo">${photoHtml}</div>
        <div class="profile-info">
          <h1>${fellow.name}</h1>
          <div class="profile-title">${fellow.title}</div>
          <div class="profile-email"><i class="fa-solid fa-envelope"></i>${fellow.email}</div>
        </div>
      </div>
      <div class="profile-body">
        <div class="profile-section">
          <h2>Biographie</h2>
          <p class="profile-bio">${fellow.bio}</p>
        </div>
        <div class="profile-section">
          <h2>Axes de recherche</h2>
          <div class="profile-themes">
            ${fellow.themes.map(t => `<span class="profile-theme-tag">${t}</span>`).join('')}
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

// Gerer le bouton retour du navigateur
window.addEventListener('popstate', () => {
  const params = new URLSearchParams(window.location.search);
  const fellowId = params.get('id');
  if (fellowId) {
    showProfile(fellowId);
  } else {
    showGrid();
  }
});
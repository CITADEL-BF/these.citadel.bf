const params = new URLSearchParams(window.location.search);
const pubId = params.get('id');

fetch('../data/publications.json')
  .then(r => r.json())
  .then(data => {
    const pub = data.find(p => p.id === pubId);
    if (!pub) {
      document.getElementById('detailPage').innerHTML = '<p style="text-align:center;padding:60px;">Publication introuvable</p>';
      return;
    }
    render(pub);
  });

function render(p) {
  const authorsHtml = p.authors.map(a => `${a.name} <span style="color:#999">(${a.affiliation})</span>`).join(', ');
  const keywordsHtml = p.keywords.map(k => `<span class="kw-tag">${k}</span>`).join('');
const doiBtn = p.doi ? `<a class="btn-action btn-doi" href="https://doi.org/${p.doi}" target="_blank">🔗 DOI/URL</a>` : '';
  document.getElementById('detailPage').innerHTML = `
    <a class="back-link" href="publications.html">← Retour aux publications</a>
    <div class="detail-card">
      <span class="detail-type">${p.type}</span>
      <span class="detail-status">${p.status}</span>
      <h1 class="detail-title">${p.title}</h1>
      <p class="detail-authors"><strong>Auteurs :</strong> ${authorsHtml}</p>
      <p class="detail-meta">Publié dans <strong>${p.venue}</strong> • ${p.date} • Axe : ${p.theme}</p>

      <div class="detail-section">
        <h3>Résumé</h3>
        <p class="detail-abstract">${p.abstract}</p>
      </div>

      <div class="detail-section">
        <h3>Mots-clés</h3>
        <div class="detail-keywords">${keywordsHtml}</div>
      </div>

      <div class="detail-actions">
        <a class="btn-action btn-pdf-detail" href="../${p.pdf_url}" target="_blank">📄 Télécharger le PDF</a>
        ${doiBtn}
      </div>
    </div>
  `;
  document.getElementById('detailPage').style.opacity = '1';
}
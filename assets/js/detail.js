const params = new URLSearchParams(window.location.search);
const pubId = params.get('id');

Promise.all([
  fetch('../data/publications.json').then(r => r.json()).catch(() => []),
  fetch(`${SUPABASE_URL}/rest/v1/publications?id=eq.${pubId}`, {
    headers: {
      "apikey": SUPABASE_ANON,
      "Authorization": `Bearer ${SUPABASE_ANON}`
    }
  }).then(r => r.json()).catch(() => [])
]).then(([jsonPubs, supaPubs]) => {
  const allPubs = [...jsonPubs, ...supaPubs];
  const pub = allPubs.find(p => p.id == pubId || p.id === pubId);
  if (!pub) {
    document.getElementById('detailPage').innerHTML = '<p style="text-align:center;padding:60px;">Publication introuvable</p>';
    return;
  }
  render(pub);
});

function render(p) {
  const authorsHtml = Array.isArray(p.authors)
    ? p.authors.map(a => `${a.name} <span style="color:#999">(${a.affiliation})</span>`).join(', ')
    : (p.authors || '');

  const keywordsHtml = Array.isArray(p.keywords)
    ? p.keywords.map(k => `<span class="kw-tag">${k}</span>`).join('')
    : (p.keywords || '').split(',').map(k => `<span class="kw-tag">${k.trim()}</span>`).join('');

  const doiBtn = p.doi ? `<a class="btn-action btn-doi" href="${p.doi}" target="_blank">🔗 DOI/URL</a>` : '';
  const pdfUrl = p.pdf_url ? (p.pdf_url.startsWith('http') ? p.pdf_url : `../${p.pdf_url}`) : '#';

  document.getElementById('detailPage').innerHTML = `
    <a class="back-link" href="publications.html">← Retour aux publications</a>
    <div class="detail-card">
      <span class="detail-type">${p.type}</span>
      <span class="detail-status">${p.status || ''}</span>
      <h1 class="detail-title">${p.title}</h1>
      <p class="detail-authors"><strong>Auteurs :</strong> ${authorsHtml}</p>
      <p class="detail-meta">Publié dans <strong>${p.venue || ''}</strong> • ${p.date || p.year} • Axe : ${p.theme || ''}</p>
      <div class="detail-section">
        <h3>Résumé</h3>
        <p class="detail-abstract">${p.abstract}</p>
      </div>
      <div class="detail-section">
        <h3>Mots-clés</h3>
        <div class="detail-keywords">${keywordsHtml}</div>
      </div>
      <div class="detail-actions">
        <a class="btn-action btn-pdf-detail" href="${pdfUrl}" target="_blank">📄 Télécharger le PDF</a>
        ${doiBtn}
      </div>
    </div>
  `;
  document.getElementById('detailPage').style.opacity = '1';
}
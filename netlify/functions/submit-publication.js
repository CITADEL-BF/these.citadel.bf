// netlify/functions/submit-publication.js
// Cette fonction reçoit les données du formulaire et crée une Pull Request sur GitHub

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO  = process.env.GITHUB_REPO;   // ex: "CITADEL-BF/these.citadel.bf"
const GITHUB_API   = "https://api.github.com";

exports.handler = async (event) => {
  // Seulement POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // ── 1. Lire le body (multipart ou JSON) ─────────────────────────────────────
  let fields = {};
  let pdfBase64 = null;
  let pdfFilename = null;

  try {
    const contentType = event.headers["content-type"] || "";

    if (contentType.includes("application/json")) {
      const body = JSON.parse(event.body);
      fields = body;
      pdfBase64 = body.pdf_base64;
      pdfFilename = body.pdf_filename;
    } else {
      // multipart/form-data via Netlify (décodé automatiquement si isBase64Encoded)
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Envoyez les données en JSON avec le PDF encodé en base64." })
      };
    }
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Body invalide." }) };
  }

  // ── 2. Validation des champs obligatoires ────────────────────────────────────
  const required = ["titre", "auteurs", "resume", "annee", "universite", "domaine", "mots_cles"];
  for (const f of required) {
    if (!fields[f] || fields[f].toString().trim() === "") {
      return { statusCode: 400, body: JSON.stringify({ error: `Champ manquant : ${f}` }) };
    }
  }
  if (!pdfBase64 || !pdfFilename) {
    return { statusCode: 400, body: JSON.stringify({ error: "Fichier PDF manquant." }) };
  }

  // ── 3. Construire les données de la publication ──────────────────────────────
  const slugTitle = fields.titre
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);

  const pubId    = `citadel-${fields.annee}-${slugTitle}`;
  const pdfPath  = `papers/${pubId}.pdf`;
  const branchName = `submit/${pubId}-${Date.now()}`;

  const auteursList = fields.auteurs.split(",").map(a => ({
    name: a.trim(),
    affiliation: fields.universite
  }));

  const newPublication = {
    id: pubId,
    title: fields.titre,
    authors: auteursList,
    type: fields.type_doc || "Thèse",
    venue: fields.universite,
    year: parseInt(fields.annee),
    date: fields.annee,
    abstract: fields.resume,
    keywords: fields.mots_cles.split(",").map(k => k.trim()),
    pdf_url: pdfPath,
    doi: "",
    status: "En attente de validation",
    theme: fields.domaine,
    featured: false,
    submitted_by: fields.submitter_email || "",
    submitted_at: new Date().toISOString()
  };

  // ── 4. Appels GitHub API ─────────────────────────────────────────────────────
  const headers = {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "User-Agent": "citadel-submit-bot"
  };

  try {
    // 4a. Récupérer le SHA de la branche main
    const refRes = await fetch(`${GITHUB_API}/repos/${GITHUB_REPO}/git/ref/heads/main`, { headers });
    if (!refRes.ok) throw new Error("Impossible de lire la branche main.");
    const refData = await refRes.json();
    const mainSha = refData.object.sha;

    // 4b. Créer une nouvelle branche
    await fetch(`${GITHUB_API}/repos/${GITHUB_REPO}/git/refs`, {
      method: "POST",
      headers,
      body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: mainSha })
    });

    // 4c. Uploader le PDF (encodé base64)
    await fetch(`${GITHUB_API}/repos/${GITHUB_REPO}/contents/${pdfPath}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: `feat: ajout PDF "${fields.titre}"`,
        content: pdfBase64,
        branch: branchName
      })
    });

    // 4d. Lire publications.json actuel
    const pubJsonRes = await fetch(
      `${GITHUB_API}/repos/${GITHUB_REPO}/contents/data/publications.json?ref=${branchName}`,
      { headers }
    );
    const pubJsonData = await pubJsonRes.json();
    const existingContent = JSON.parse(Buffer.from(pubJsonData.content, "base64").toString("utf8"));

    // 4e. Ajouter la nouvelle publication
    existingContent.unshift(newPublication);
    const updatedContent = Buffer.from(JSON.stringify(existingContent, null, 2)).toString("base64");

    await fetch(`${GITHUB_API}/repos/${GITHUB_REPO}/contents/data/publications.json`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: `feat: soumission "${fields.titre}"`,
        content: updatedContent,
        sha: pubJsonData.sha,
        branch: branchName
      })
    });

    // 4f. Créer la Pull Request
    const prRes = await fetch(`${GITHUB_API}/repos/${GITHUB_REPO}/pulls`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: `[Soumission] ${fields.titre}`,
        body: `## Nouvelle soumission\n\n**Auteur(s):** ${fields.auteurs}\n**Année:** ${fields.annee}\n**Université:** ${fields.universite}\n**Domaine:** ${fields.domaine}\n**Mots-clés:** ${fields.mots_cles}\n\n### Résumé\n${fields.resume}\n\n---\n*Soumis par : ${fields.submitter_email || "inconnu"}*`,
        head: branchName,
        base: "main"
      })
    });

    const prData = await prRes.json();

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: true,
        message: "Soumission reçue ! Elle sera publiée après validation par un administrateur.",
        pr_url: prData.html_url
      })
    };

  } catch (err) {
    console.error("Erreur GitHub:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur lors de la création de la Pull Request.", detail: err.message })
    };
  }
};
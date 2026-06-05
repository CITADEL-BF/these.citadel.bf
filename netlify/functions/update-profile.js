// netlify/functions/update-profile.js
// Met à jour fellows.json directement sur la branche main

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO  = process.env.GITHUB_REPO;
const GITHUB_API   = "https://api.github.com";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Vérifier que l'utilisateur est authentifié via Netlify Identity
  const authHeader = event.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return { statusCode: 401, body: JSON.stringify({ error: "Non autorisé." }) };
  }

  let fields = {};
  try {
    fields = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Body invalide." }) };
  }

  // Validation
  const required = ["email", "name", "title", "role", "bio", "themes"];
  for (const f of required) {
    if (!fields[f] || fields[f].toString().trim() === "") {
      return { statusCode: 400, body: JSON.stringify({ error: `Champ manquant : ${f}` }) };
    }
  }

  const headers = {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "User-Agent": "citadel-profile-bot"
  };

  try {
    // 1. Lire fellows.json actuel
    const res = await fetch(
      `${GITHUB_API}/repos/${GITHUB_REPO}/contents/data/fellows.json`,
      { headers }
    );
    const data = await res.json();
    const fellows = JSON.parse(Buffer.from(data.content, "base64").toString("utf8"));

    // 2. Vérifier si le fellow existe déjà (par email)
    const existingIndex = fellows.findIndex(
      f => f.email && f.email.toLowerCase() === fields.email.toLowerCase()
    );

    // 3. Construire l'objet fellow
    const fellowId = fields.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-");
    const newFellow = {
      id: existingIndex >= 0 ? fellows[existingIndex].id : fellowId,
      name: fields.name,
      title: fields.title,
      role: fields.role,
      photo: fields.photo || "",
      bio: fields.bio,
      email: fields.email,
      themes: Array.isArray(fields.themes) ? fields.themes : [fields.themes],
      publications_count: existingIndex >= 0 ? fellows[existingIndex].publications_count : 0
    };

    // 4. Mettre à jour ou ajouter
    if (existingIndex >= 0) {
      fellows[existingIndex] = newFellow;
    } else {
      fellows.push(newFellow);
    }

    // 5. Pousser directement sur main
    const updatedContent = Buffer.from(JSON.stringify(fellows, null, 2)).toString("base64");

    const pushRes = await fetch(
      `${GITHUB_API}/repos/${GITHUB_REPO}/contents/data/fellows.json`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify({
          message: `feat: profil mis à jour pour ${fields.name}`,
          content: updatedContent,
          sha: data.sha,
          branch: "main"
        })
      }
    );

    if (!pushRes.ok) {
      const err = await pushRes.json();
      throw new Error(err.message || "Erreur GitHub");
    }

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        success: true,
        message: "Profil mis à jour avec succès !"
      })
    };

  } catch (err) {
    console.error("Erreur:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur lors de la mise à jour.", detail: err.message })
    };
  }
};
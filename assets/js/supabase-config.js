const SUPABASE_URL  = "https://kajnizlzzpdcmaahnmnf.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtham5pemx6enBkY21hYWhubW5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5OTkzMTAsImV4cCI6MjA5NjU3NTMxMH0.CSaSsaU7xul6FweioT00rvKczbyiacC27f2la7PqUeo";

async function supabaseFetch(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const headers = {
    "apikey": SUPABASE_ANON,
    "Authorization": `Bearer ${SUPABASE_ANON}`,
    "Content-Type": "application/json",
    "Prefer": options.prefer || "return=representation",
    ...options.headers
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(JSON.stringify(err));
  }
  return options.method === "DELETE" ? true : res.json();
}
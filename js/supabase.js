/* ============================================================
   LASHAWN ACADEMY - SUPABASE CLIENT
   ============================================================ */

const SUPABASE_URL = "https://qjfinbftcserrjiedduf.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_tzXXoqZwC2SXZwhS8km2FQ_pNQcuCW5";

// The supabase-js library exposes createClient globally when loaded via CDN
const { createClient } = supabase;

const db = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Expose globally
window.LashawnDB = db;

// Helper: get current session
window.getSession = async function () {
  const { data, error } = await db.auth.getSession();
  if (error) throw error;
  return data.session;
};

// Helper: get current user
window.getUser = async function () {
  const { data, error } = await db.auth.getUser();
  if (error) throw error;
  return data.user;
};

// Helper: sign out
window.signOut = async function () {
  await db.auth.signOut();
  window.location.href = "login.html";
};

console.log("LashawnDB client initialized.");

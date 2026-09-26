// supabase.js
// LASHAWN ACADEMY - Supabase Client

const SUPABASE_URL = "https://qjfinbftcserrjiedduf.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_tzXXoqZwC2SXZwhS8km2FQ_pNQcuCW5";

const { createClient } = supabase;

const db = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

// Make available to other scripts
window.LashawnDB = db;

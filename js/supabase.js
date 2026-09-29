/* =========================================================
   Lashawn Academy — Supabase Client
   File: js/supabase.js
   ========================================================= */

(function () {
  "use strict";

  const SUPABASE_URL = "https://qjfinbftcserrjiedduf.supabase.co";

  const SUPABASE_ANON_KEY =
    "sb_publishable_tzXXoqZwC2SXZwhS8km2FQ_pNQcuCW5";

  /*
   * Prevent duplicate initialization.
   */
  if (window.LashawnDB) {
    console.log("LashawnDB already initialized.");
    return;
  }

  /*
   * Supabase CDN must be loaded first.
   */
  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error(
      "Supabase library not loaded. Make sure this appears BEFORE js/supabase.js:\n" +
      '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>'
    );

    window.LashawnDB = null;
    return;
  }

  try {
    window.LashawnDB = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );

    console.log("LashawnDB initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize LashawnDB:", error);
    window.LashawnDB = null;
  }
})();

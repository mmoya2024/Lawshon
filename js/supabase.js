(function () {
  "use strict";

  const SUPABASE_URL = "https://qjfinbftcserrjiedduf.supabase.co";
  const SUPABASE_ANON_KEY =
    "sb_publishable_tzXXoqZwC2SXZwhS8km2FQ_pNQcuCW5";

  if (window.LashawnDB) {
    return;
  }

  if (
    !window.supabase ||
    typeof window.supabase.createClient !== "function"
  ) {
    console.error(
      "Supabase library was not loaded before js/supabase.js."
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

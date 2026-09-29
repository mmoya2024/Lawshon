(function () {
  "use strict";

  const SUPABASE_URL =
    "https://qjfinbftcserrjiedduf.supabase.co";

  const SUPABASE_ANON_KEY =
    "sb_publishable_tzXXoqZwC2SXZwhS8km2FQ_pNQcuCW5";

  function initialize() {

    if (
      !window.supabase ||
      typeof window.supabase.createClient !== "function"
    ) {
      console.error(
        "Lashawn: Supabase JavaScript library is not loaded."
      );

      window.LashawnDB = null;

      return false;
    }

    try {

      if (window.LashawnDB) {
        console.log(
          "Lashawn: Supabase client already exists."
        );

        return true;
      }

      window.LashawnDB =
        window.supabase.createClient(
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

      console.log(
        "Lashawn: Supabase client initialized."
      );

      return true;

    } catch (error) {

      console.error(
        "Lashawn: Could not initialize Supabase client.",
        error
      );

      window.LashawnDB = null;

      return false;
    }
  }

  initialize();

})();

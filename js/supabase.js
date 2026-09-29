```javascript
/* =========================================================
   LASHAWN ACADEMY
   Supabase Client
   File: js/supabase.js
   ========================================================= */

(function () {
    "use strict";

    const SUPABASE_URL = "https://qjfinbftcserrjiedduf.supabase.co";

    /*
      This is the Supabase publishable/anon key.
      Do NOT place a service-role/secret key in browser code.
    */
    const SUPABASE_KEY =
        "sb_publishable_tzXXoqZwC2SXZwhS8km2FQ_pNQcuCW5";

    function initialiseSupabase() {
        if (!window.supabase) {
            console.error(
                "Lashawn: Supabase JavaScript library was not loaded."
            );
            return null;
        }

        if (typeof window.supabase.createClient !== "function") {
            console.error(
                "Lashawn: Supabase createClient() is unavailable."
            );
            return null;
        }

        try {
            const client = window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_KEY,
                {
                    auth: {
                        persistSession: true,
                        autoRefreshToken: true,
                        detectSessionInUrl: true
                    }
                }
            );

            /*
              This is the ONLY database client name that the
              Lashawn application should use.
            */
            window.LashawnDB = client;

            console.log(
                "Lashawn: Supabase client created successfully."
            );

            return client;
        } catch (error) {
            console.error(
                "Lashawn: Failed to create Supabase client.",
                error
            );

            return null;
        }
    }

    /*
      Prevent accidental duplicate initialisation.
    */
    if (!window.LashawnDB) {
        initialiseSupabase();
    }
})();
```

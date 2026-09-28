// ============================================================
// LASHAWN ACADEMY - SUPABASE CONNECTION
// ============================================================

console.log("========================================");
console.log("LASHAWN SUPABASE.JS STARTED");
console.log("========================================");

(function () {

    "use strict";

    const SUPABASE_URL =
        "https://qjfinbftcserrjiedduf.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_tzXXoqZwC2SXZwhS8km2FQ_pNQcuCW5";

    console.log(
        "Supabase URL:",
        SUPABASE_URL
    );

    console.log(
        "Supabase key present:",
        !!SUPABASE_KEY
    );


    // --------------------------------------------------------
    // CHECK SUPABASE LIBRARY
    // --------------------------------------------------------

    if (typeof window.supabase === "undefined") {

        console.error(
            "ERROR: window.supabase is undefined."
        );

        console.error(
            "The Supabase CDN did not load."
        );

        window.LashawnDB = null;

        return;
    }


    console.log(
        "Supabase CDN loaded successfully."
    );


    // --------------------------------------------------------
    // CREATE CLIENT
    // --------------------------------------------------------

    try {

        window.LashawnDB =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_KEY
            );


        console.log(
            "LashawnDB created:",
            window.LashawnDB
        );


        console.log(
            "Lashawn Supabase connection initialized successfully."
        );


    } catch (error) {

        console.error(
            "ERROR CREATING SUPABASE CLIENT:",
            error
        );

        window.LashawnDB = null;

    }

})();

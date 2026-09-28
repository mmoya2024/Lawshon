// ============================================================
// LASHAWN ACADEMY
// CENTRAL SUPABASE CLIENT
// ============================================================

(function () {
    'use strict';

    const SUPABASE_URL =
        'https://qjfinbftcserrjiedduf.supabase.co';

    const SUPABASE_KEY =
        'sb_publishable_tzXXoqZwC2SXZwhS8km2FQ_pNQcuCW5';

    console.log('Lashawn: loading js/supabase.js');

    // ----------------------------------------------------------
    // Check Supabase CDN
    // ----------------------------------------------------------

    if (!window.supabase) {
        console.error(
            'Lashawn ERROR: Supabase JavaScript library was not loaded.'
        );

        window.LashawnDB = null;
        return;
    }

    // ----------------------------------------------------------
    // Check configuration
    // ----------------------------------------------------------

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.error(
            'Lashawn ERROR: Supabase URL or key is missing.'
        );

        window.LashawnDB = null;
        return;
    }

    // ----------------------------------------------------------
    // Create ONE shared Supabase client
    // ----------------------------------------------------------

    try {

        window.LashawnDB = window.supabase.createClient(
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

        console.log(
            'Lashawn: Supabase client created successfully.'
        );

        console.log(
            'Lashawn Supabase URL:',
            SUPABASE_URL
        );

    } catch (error) {

        console.error(
            'Lashawn ERROR: Failed to create Supabase client:',
            error
        );

        window.LashawnDB = null;
    }

})();

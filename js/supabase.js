// ============================================================
// LASHAWN ACADEMY - SUPABASE CLIENT
// ============================================================

(function () {
    'use strict';

    const SUPABASE_URL =
        'https://qjfinbftcserrjiedduf.supabase.co';

    const SUPABASE_KEY =
        'PASTE_THE_REAL_PUBLISHABLE_OR_ANON_KEY_HERE';

    if (!window.supabase) {
        console.error(
            'Supabase JavaScript library is missing.'
        );
        return;
    }

    if (!SUPABASE_KEY) {
        console.error(
            'Supabase key is missing in js/supabase.js'
        );
        return;
    }

    try {

        window.LashawnDB =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_KEY
            );

        console.log(
            'Lashawn Academy Supabase connected successfully.'
        );

    } catch (error) {

        console.error(
            'Failed to initialize LashawnDB:',
            error
        );

    }

})();

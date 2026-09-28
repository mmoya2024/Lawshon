// ============================================================
// LASHAWN ACADEMY - SUPABASE CLIENT
// ============================================================

(function () {
    'use strict';

    const SUPABASE_URL =
        'https://qjfinbftcserrjiedduf.supabase.co';

    const SUPABASE_KEY =
        'sb_publishable_tzXXoqZwC2SXZwhS8km2FQ_pNQcuCW5';

    if (!window.supabase) {
        console.error(
            'Supabase JavaScript library is missing.'
        );
        return;
    }

    try {
        window.LashawnDB = window.supabase.createClient(
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

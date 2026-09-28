// ============================================================
// LASHAWN ACADEMY - SUPABASE CLIENT
// ============================================================

(function () {
    'use strict';

    const SUPABASE_URL = 'https://qjfinbftcserrjiedduf.supabase.co';

    // IMPORTANT:
    // Paste your Supabase Publishable/Anon key between the quotes.
    const SUPABASE_KEY = 'PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE';

    if (!window.supabase) {
        console.error('Supabase JavaScript library is missing.');
        return;
    }

    if (
        !SUPABASE_URL ||
        !SUPABASE_KEY ||
        SUPABASE_KEY === 'PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE'
    ) {
        console.error('Supabase URL or key is missing.');
        return;
    }

    try {

        window.LashawnDB = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );

        console.log('LashawnDB initialized successfully.');

    } catch (error) {

        console.error(
            'Failed to initialize LashawnDB:',
            error
        );

    }

})();

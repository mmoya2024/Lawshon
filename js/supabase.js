// ============================================================
// LASHAWN ACADEMY - SUPABASE CONFIGURATION
// ============================================================

(function () {
    'use strict';

    const SUPABASE_URL = 'https://qjfinbftcserrjiedduf.supabase.co';

    const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

    // Make sure Supabase library is loaded
    if (!window.supabase) {
        console.error('Supabase JS library is not loaded.');
        return;
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error('Supabase URL or Anon Key is missing.');
        return;
    }

    try {
        window.LashawnDB = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY
        );

        console.log('Lashawn Academy Supabase connected.');

    } catch (error) {
        console.error(
            'Failed to initialize Lashawn Supabase:',
            error
        );
    }
})();

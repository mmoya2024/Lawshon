(function () {
    'use strict';

    const SUPABASE_URL = 'https://qjfinbftcserrjiedduf.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_tzXXoqZwC2SXZwhS8km2FQ_pNQcuCW5';

    console.log('Lashawn: loading js/supabase.js');

    if (!window.supabase) {
        console.error('Lashawn: Supabase CDN was not loaded.');
        return;
    }

    window.LashawnDB = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

    console.log('Lashawn: Supabase client created.');
})();

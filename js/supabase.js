// LASHAWN ACADEMY - SUPABASE CLIENT
(function () {
  'use strict';
  const SUPABASE_URL = 'https://qjfinbftcserrjiedduf.supabase.co';
  // Paste your Supabase Publishable / anon key between the quotes (Supabase > Project Settings > API).
  const SUPABASE_KEY = 'PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE';

  if (!window.supabase) { console.error('Supabase JavaScript library is missing.'); return; }
  if (!SUPABASE_KEY || SUPABASE_KEY.indexOf('PASTE_YOUR') === 0) { console.error('Supabase key is missing in js/supabase.js'); return; }
  try {
    window.LashawnDB = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch (e) { console.error('Failed to initialize LashawnDB:', e); }
})();

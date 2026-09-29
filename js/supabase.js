(function () {
  "use strict";

  const SUPABASE_URL = "https://qjfinbftcserrjiedduf.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqZmluYmZ0Y3NlcnJqaWVkZHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzOTgzMzksImV4cCI6MjEwNTk3NDMzOX0.WHAkxqTTtzQH_za4OPMWJAILRUUHIL5Akk8900QX5c0";

  if (window.LashawnDB) return;

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error("Supabase library was not loaded before js/supabase.js.");
    window.LashawnDB = null;
    return;
  }

  if (!SUPABASE_URL.includes(".supabase.co") || SUPABASE_ANON_KEY.length < 100) {
    console.error("Supabase URL or key looks invalid.");
    window.LashawnDB = null;
    return;
  }

  try {
    window.LashawnDB = window.supabase.createClient(
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
    console.log("LashawnDB initialized.");
  } catch (error) {
    console.error("Failed to initialize LashawnDB:", error);
    window.LashawnDB = null;
  }
})();

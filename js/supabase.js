/* ============================================================
   LASHAWN ACADEMY - SUPABASE CLIENT (shared by login + dashboards)
   Load AFTER the supabase-js CDN script.
   ============================================================ */
(function () {
  "use strict";

  const SUPABASE_URL = "https://qjfinbftcserrjiedduf.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_tzXXoqZwC2SXZwhS8km2FQ_pNQcuCW5";

  if (!window.supabase || !window.supabase.createClient) {
    console.error("supabase-js CDN did not load.");
    return;
  }

  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  window.LashawnDB = db;

  /* Where each role lands after login. Change these when you build
     separate pages; for now everyone uses dashboard.html. */
  window.ROLE_HOME = {
    SUPER_ADMIN: "dashboard.html",
    ADMIN: "dashboard.html",
    BRANCH_MANAGER: "dashboard.html",
    RECEPTIONIST: "dashboard.html",
    INSTRUCTOR: "dashboard.html",
    FINANCE: "dashboard.html",
    PRINTING_OPERATOR: "dashboard.html",
    COMPUTER_TRAINER: "dashboard.html",
    AUDITOR: "dashboard.html",
  };

  window.getSession = async function () {
    const { data, error } = await db.auth.getSession();
    if (error) throw error;
    return data.session;
  };

  window.getUser = async function () {
    const { data, error } = await db.auth.getUser();
    if (error) throw error;
    return data.user;
  };

  window.signOut = async function () {
    try { sessionStorage.removeItem("lashawn_staff"); } catch (e) {}
    try { await db.auth.signOut(); } catch (e) { console.error(e); }
    window.location.href = "login.html";
  };

  /* Page guard: call at the top of every protected page.
     Returns the staff row, or redirects to login and returns null. */
  window.requireStaff = async function (allowedRoles) {
    try {
      const session = await window.getSession();
      if (!session) { window.location.replace("login.html"); return null; }

      const { data: staff, error } = await db
        .from("staff")
        .select("id, staff_number, first_name, last_name, email, role, branch_id, is_active")
        .eq("auth_user_id", session.user.id)
        .maybeSingle();

      if (error || !staff || !staff.is_active) {
        console.error("Staff check failed:", error);
        await window.signOut();
        return null;
      }

      if (Array.isArray(allowedRoles) && !allowedRoles.includes(staff.role)) {
        alert("You do not have access to this page.");
        window.location.replace(window.ROLE_HOME[staff.role] || "login.html");
        return null;
      }

      sessionStorage.setItem("lashawn_staff", JSON.stringify(staff));
      return staff;
    } catch (err) {
      console.error("requireStaff error:", err);
      window.location.replace("login.html");
      return null;
    }
  };

  console.log("LashawnDB client initialized.");
})();

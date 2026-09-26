/* ============================================================
   LASHAWN ACADEMY - ROLE GUARD
   Redirects users based on their role.
   Include AFTER js/supabase.js
   ============================================================ */

(function () {
  window.LashawnRoles = {
    SUPER_ADMIN: "SUPER_ADMIN",
    ADMIN: "ADMIN",
    BRANCH_MANAGER: "BRANCH_MANAGER",
    RECEPTIONIST: "RECEPTIONIST",
    INSTRUCTOR: "INSTRUCTOR",
    FINANCE: "FINANCE",
    COMPUTER_TRAINER: "COMPUTER_TRAINER",
    AUDITOR: "AUDITOR",
    NONE: "NONE",
  };

  // Fetch the current user's role from Supabase
  window.getMyRole = async function () {
    try {
      const { data, error } = await LashawnDB.rpc("get_my_role");
      if (error) throw error;
      return data || "NONE";
    } catch (err) {
      console.warn("Could not determine role:", err);
      return "NONE";
    }
  };

  // Redirect helpers
  window.requireSuperAdmin = async function () {
    const role = await window.getMyRole();
    if (role === "SUPER_ADMIN" || role === "ADMIN") return role;

    if (role === "FINANCE" || role === "RECEPTIONIST" || role === "BRANCH_MANAGER") {
      window.location.href = "admin.html";
      return role;
    }

    // Anyone else: kick out
    await window.signOut();
    return role;
  };

  window.requireAdminAccess = async function () {
    const role = await window.getMyRole();
    const allowed = [
      "SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER",
      "RECEPTIONIST", "FINANCE",
    ];
    if (allowed.includes(role)) return role;

    // Not allowed — sign out
    await window.signOut();
    return role;
  };
})();

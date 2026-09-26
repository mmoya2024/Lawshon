/* ============================================================
   LASHAWN ACADEMY - PUBLIC WEBSITE APP
   ============================================================ */

document.addEventListener("DOMContentLoaded", async () => {
  console.log("LASHAWN ACADEMY website loaded.");

  if (!window.LashawnDB) {
    console.error("Supabase client was not loaded.");
    return;
  }

  // Check auth state and update nav
  await updateAuthNav();

  // Load driving classes for public display (optional)
  await loadPublicDrivingClasses();
});

async function updateAuthNav() {
  try {
    const session = await window.getSession();
    const nav = document.querySelector("nav");
    if (!nav) return;

    // Remove existing auth links if any
    nav.querySelectorAll(".auth-link").forEach((el) => el.remove());

    if (session) {
      // Logged in - show dashboard link
      const dashLink = document.createElement("a");
      dashLink.href = "dashboard.html";
      dashLink.className = "cta auth-link";
      dashLink.textContent = "Dashboard";
      nav.appendChild(dashLink);

      const logoutLink = document.createElement("a");
      logoutLink.href = "#";
      logoutLink.className = "auth-link";
      logoutLink.textContent = "Logout";
      logoutLink.onclick = (e) => {
        e.preventDefault();
        window.signOut();
      };
      nav.appendChild(logoutLink);
    } else {
      // Not logged in - show login link
      const loginLink = document.createElement("a");
      loginLink.href = "login.html";
      loginLink.className = "cta auth-link";
      loginLink.textContent = "Staff Login";
      nav.appendChild(loginLink);
    }
  } catch (err) {
    console.warn("Auth check failed:", err);
  }
}

async function loadPublicDrivingClasses() {
  try {
    const { data, error } = await LashawnDB
      .from("driving_classes")
      .select("id, class_code, class_name, description, minimum_age")
      .eq("is_active", true)
      .order("class_code");

    if (error) {
      console.warn("Could not load driving classes:", error.message);
      return;
    }

    console.log("Driving classes loaded:", data);
  } catch (err) {
    console.warn("Connection error:", err);
  }
}

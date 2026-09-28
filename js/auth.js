/* ============================================================
   LASHAWN ACADEMY - LOGIN LOGIC
   Requires: supabase-js CDN + js/supabase.js (window.LashawnDB)
   ============================================================ */
"use strict";

document.addEventListener("DOMContentLoaded", () => {

  /* Set to false once everything works, to hide technical details */
  const DEBUG = true;

  const db = window.LashawnDB;

  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginButton = document.getElementById("loginButton");
  const messageBox = document.getElementById("message");
  const togglePassword = document.getElementById("togglePassword");

  const ROLE_NAMES = {
    SUPER_ADMIN: "Super Administrator",
    ADMIN: "Office Administrator",
    BRANCH_MANAGER: "Supervisor",
    RECEPTIONIST: "Receptionist",
    INSTRUCTOR: "Instructor",
    FINANCE: "Finance",
    PRINTING_OPERATOR: "Printing Operator",
    COMPUTER_TRAINER: "Computer Trainer",
    AUDITOR: "Auditor",
  };

  function homeFor(role) {
    return (window.ROLE_HOME || {})[role] || "dashboard.html";
  }

  function showMessage(text, type, detail) {
    messageBox.className = "msg " + (type || "error");
    messageBox.textContent = text;
    if (DEBUG && detail) {
      const small = document.createElement("small");
      small.textContent = "Details: " + detail;
      messageBox.appendChild(small);
    }
  }

  function clearMessage() {
    messageBox.className = "msg";
    messageBox.textContent = "";
  }

  function setLoading(loading) {
    loginButton.disabled = loading;
    if (loading) loginButton.innerHTML = '<span class="spinner"></span> Signing in...';
    else loginButton.textContent = "Sign In";
  }

  if (togglePassword) {
    togglePassword.addEventListener("click", () => {
      const hidden = passwordInput.type === "password";
      passwordInput.type = hidden ? "text" : "password";
      togglePassword.textContent = hidden ? "Hide" : "Show";
    });
  }

  if (!db) {
    showMessage("System connection error.", "error",
      "window.LashawnDB is missing. js/supabase.js did not load.");
    return;
  }

  /* Error type that carries a friendly message plus technical detail */
  class LoginError extends Error {
    constructor(message, detail) { super(message); this.detail = detail; }
  }

  async function fetchStaff(userId) {
    const { data, error } = await db
      .from("staff")
      .select("id, auth_user_id, staff_number, first_name, last_name, email, role, branch_id, is_active")
      .eq("auth_user_id", userId)
      .maybeSingle();

    if (error) {
      throw new LoginError("Unable to read your staff profile.",
        error.message + (error.code ? " (code " + error.code + ")" : "") +
        " - likely missing RLS policy; run rls_policies.sql");
    }
    if (!data) {
      throw new LoginError("No staff profile is linked to this account.",
        "No staff row has auth_user_id = " + userId);
    }
    if (!data.is_active) {
      throw new LoginError("Your staff account is inactive. Contact the administrator.");
    }
    return data;
  }

  function clearLocal() {
    try { sessionStorage.removeItem("lashawn_staff"); } catch (e) {}
  }

  async function login(email, password) {
    clearMessage();
    setLoading(true);

    try {
      const { data, error } = await db.auth.signInWithPassword({ email, password });

      if (error) {
        const friendly = /invalid login/i.test(error.message)
          ? "Invalid email or password."
          : /not confirmed/i.test(error.message)
          ? "This email has not been confirmed yet."
          : "Sign-in failed.";
        throw new LoginError(friendly, error.message);
      }
      if (!data || !data.user) throw new LoginError("Login failed. Please try again.");

      const staff = await fetchStaff(data.user.id);
      sessionStorage.setItem("lashawn_staff", JSON.stringify(staff));

      showMessage("Welcome " + staff.first_name + ". Signing in as " +
        (ROLE_NAMES[staff.role] || staff.role) + "...", "success");

      setTimeout(() => { window.location.href = homeFor(staff.role); }, 600);

    } catch (err) {
      console.error("Login failed:", err);
      clearLocal();
      try { await db.auth.signOut(); } catch (e) {}
      showMessage(err.message || "Unable to sign in.", "error",
        err.detail || (err.message !== "Unable to sign in." ? "" : String(err)));
      setLoading(false);
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    if (!email) { showMessage("Please enter your email address."); emailInput.focus(); return; }
    if (!password) { showMessage("Please enter your password."); passwordInput.focus(); return; }

    await login(email, password);
  });

  /* If already signed in with a valid staff account, skip the form */
  (async function checkExistingSession() {
    try {
      const { data } = await db.auth.getSession();
      if (!data || !data.session) return;
      const staff = await fetchStaff(data.session.user.id);
      sessionStorage.setItem("lashawn_staff", JSON.stringify(staff));
      window.location.href = homeFor(staff.role);
    } catch (err) {
      console.warn("Existing session not valid:", err.message);
      clearLocal();
      try { await db.auth.signOut(); } catch (e) {}
    }
  })();

  /* Global helpers for other pages */
  window.getLashawnStaff = function () {
    try { return JSON.parse(sessionStorage.getItem("lashawn_staff")); }
    catch (e) { return null; }
  };
  window.hasLashawnRole = function (roles) {
    const s = window.getLashawnStaff();
    if (!s) return false;
    return (Array.isArray(roles) ? roles : [roles]).includes(s.role);
  };
  window.lashawnLogout = async function () {
    clearLocal();
    try { await db.auth.signOut(); } catch (e) {}
    window.location.href = "login.html";
  };
});

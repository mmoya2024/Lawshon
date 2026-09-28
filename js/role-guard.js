// LASHAWN ACADEMY - OFFICE ADMIN ROLE GUARD
(function () {
  'use strict';
  const DB = window.LashawnDB;

  window.requireAdminAccess = async function () {
    if (!DB) { window.location.replace('login.html'); return false; }
    try {
      const { data: { session }, error } = await DB.auth.getSession();
      if (error || !session || !session.user) { window.location.replace('login.html'); return false; }
      const u = session.user, a = u.app_metadata || {}, m = u.user_metadata || {};
      const allowed =
        a.role === 'admin' || a.role === 'staff' || m.role === 'admin' || m.role === 'staff' ||
        a.account_type === 'admin' || a.account_type === 'staff' ||
        m.account_type === 'admin' || m.account_type === 'staff' ||
        m.office_role === 'Office Admin';
      if (!allowed) {
        await DB.auth.signOut();
        alert('You do not have Office Admin access.');
        window.location.replace('login.html');
        return false;
      }
      return true;
    } catch (e) {
      console.error('Office Admin authentication error:', e);
      window.location.replace('login.html');
      return false;
    }
  };

  window.logoutAdmin = async function () {
    try { if (DB) await DB.auth.signOut(); } catch (e) { console.error(e); }
    window.location.replace('login.html');
  };
})();

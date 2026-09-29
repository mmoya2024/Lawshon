/* Super Admin extras: access guard, real overview stats, payment approvals,
   student delete, and office user creation. Loaded AFTER the main dashboard script. */
(function () {
  const $ = (id) => document.getElementById(id);
  const sum = (rows, k) => (rows || []).reduce((a, r) => a + Number(r[k] || 0), 0);
  const nm = (s) => [s?.first_name, s?.middle_name, s?.last_name].filter(Boolean).join(" ");
  let PEND = [];

  document.addEventListener("DOMContentLoaded", async () => {
    const { data: { session } } = await LashawnDB.auth.getSession();
    if (!session) return; /* main script redirects to login */

    /* Only Super Admin may use this dashboard */
    let ok = false;
    try { ok = (await LashawnDB.rpc("is_super_admin")).data === true; } catch (_) {}
    if (!ok) { location.replace("admin.html"); return; }

    /* Tabs */
    const nav = document.querySelector("nav.tabs");
    nav.insertAdjacentHTML("beforeend",
      '<button data-panel="approvals">Approvals <span id="apprBadge"></span></button>' +
      '<button data-panel="activity">Activity</button>' +
      '<button data-panel="users">Office Users</button>');
    nav.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-panel]"); if (!b) return;
      nav.querySelectorAll("button").forEach((x) => x.classList.remove("active")); b.classList.add("active");
      document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
      $("panel-" + b.dataset.panel).classList.add("active");
      if (b.dataset.panel === "approvals") loadApprovals();
      if (b.dataset.panel === "users") loadUsers();
      if (b.dataset.panel === "activity") loadActivity();
    });

    /* Panels */
    document.querySelector("main").insertAdjacentHTML("beforeend", `
      <section class="panel" id="panel-approvals">
        <h1>Payment Approvals</h1>
        <p class="lede">Payments below 50% of the fee. No receipt exists until you approve.</p>
        <div class="card"><div class="tbl-wrap"><table>
          <thead><tr><th>Payment No.</th><th>Date</th><th>Student / Customer</th><th>Invoice</th><th>Amount</th><th>% of Fee</th><th>Details</th><th></th></tr></thead>
          <tbody id="appr-table"></tbody></table></div></div>
      </section>
      <section class="panel" id="panel-activity">
        <h1>Office Activity</h1>
        <p class="lede">Everything office staff create, change or delete, newest first.</p>
        <div class="toolbar"><input class="search" id="actSearch" placeholder="Search person, action or record...">
          <select class="filter-select" id="actTable"><option value="">All records</option>
            <option value="students">Students</option><option value="enrolments">Enrolments</option>
            <option value="invoices">Invoices</option><option value="payments">Payments</option>
            <option value="printing_jobs">Printing jobs</option></select>
          <button class="btn small outline" id="actRefresh" type="button">Refresh</button></div>
        <div class="card"><div class="tbl-wrap"><table>
          <thead><tr><th>Time</th><th>Who</th><th>Action</th><th>Record</th><th>Details</th></tr></thead>
          <tbody id="act-table"></tbody></table></div></div>
      </section>
      <section class="panel" id="panel-users">
        <h1>Office Users</h1>
        <p class="lede">Create login accounts for office staff. They get Office Admin access.</p>
        <div class="card"><h2>New office user</h2>
          <form id="userForm">
            <div class="form-row" style="grid-template-columns:1fr 1fr 1fr">
              <div class="field"><label>First name *</label><input id="uFirst" required></div>
              <div class="field"><label>Last name *</label><input id="uLast" required></div>
              <div class="field"><label>Phone</label><input id="uPhone"></div>
            </div>
            <div class="form-row" style="grid-template-columns:1fr 1fr auto">
              <div class="field"><label>Email *</label><input id="uEmail" type="email" required></div>
              <div class="field"><label>Temporary password * (min 8)</label><input id="uPass" type="text" minlength="8" required></div>
              <button class="btn" type="submit" id="uBtn">Create user</button>
            </div>
          </form>
        </div>
        <div class="card"><h2>Staff accounts</h2><div class="tbl-wrap"><table>
          <thead><tr><th>Staff No.</th><th>Name</th><th>Email</th><th>Role</th><th>Active</th></tr></thead>
          <tbody id="users-table"></tbody></table></div></div>
      </section>`);

    $("appr-table").addEventListener("click", onApprovalClick);
    $("userForm").addEventListener("submit", createUser);
    $("actSearch").addEventListener("input", renderActivity);
    $("actTable").addEventListener("change", renderActivity);
    $("actRefresh").addEventListener("click", loadActivity);
    document.addEventListener("click", onDeleteClick);

    /* Delete buttons on the Enrolments tab (re-added whenever the table redraws) */
    const addDel = () => document.querySelectorAll("#enroll-table tr").forEach((tr) => {
      const a = tr.querySelector("a[href*='student-profile.html?id=']");
      if (a && !tr.querySelector("[data-del]"))
        a.insertAdjacentHTML("afterend", ' <button class="btn small danger" data-del="' + a.href.split("id=")[1] + '">Delete</button>');
    });
    new MutationObserver(addDel).observe($("enroll-table"), { childList: true, subtree: true });
    addDel();

    loadStats(); refreshBadge();
  });

  /* ---------- Overview numbers (the original cards were never filled) ---------- */
  async function loadStats() {
    const [s, p, b] = await Promise.all([
      LashawnDB.from("students").select("id", { count: "exact", head: true }),
      LashawnDB.from("payments").select("amount").eq("status", "CONFIRMED").limit(10000),
      LashawnDB.from("student_balances").select("balance"),
    ]);
    $("stat-students").textContent = s.count ?? 0;
    $("stat-revenue").textContent = money(sum(p.data, "amount"));
    $("stat-balance").textContent = money(sum(b.data, "balance"));
  }

  /* ---------- Approvals ---------- */
  const who = (r) => r.students
    ? { no: r.students.student_number, name: nm(r.students) }
    : { no: r.printing_jobs?.printing_customers?.customer_number || "—", name: r.printing_jobs?.printing_customers?.customer_name || "" };

  async function fetchPending() {
    const sel = (pj) => "id,payment_number,payment_date,amount,payment_method,transaction_reference,notes," +
      "students(student_number,first_name,middle_name,last_name),enrolments(enrolment_number,programme)," +
      "invoices(invoice_number,total_amount,amount_paid)" +
      (pj ? ",printing_jobs(job_number,printing_customers(customer_name,customer_number))" : "");
    let r = await LashawnDB.from("payments").select(sel(true)).eq("status", "PENDING").order("created_at", { ascending: false });
    if (r.error) r = await LashawnDB.from("payments").select(sel(false)).eq("status", "PENDING").order("created_at", { ascending: false });
    return r;
  }
  async function refreshBadge() {
    const r = await LashawnDB.from("payments").select("id", { count: "exact", head: true }).eq("status", "PENDING");
    $("apprBadge").textContent = r.count ? "(" + r.count + ")" : "";
  }
  async function loadApprovals() {
    const r = await fetchPending();
    if (r.error) { toast(r.error.message); return; }
    PEND = r.data || [];
    $("appr-table").innerHTML = PEND.map((p, n) => {
      const t = Number(p.invoices?.total_amount || 0);
      const pct = t ? Math.round((Number(p.invoices?.amount_paid || 0) + Number(p.amount)) / t * 100) : "—";
      const w = who(p);
      return `<tr><td>${esc(p.payment_number || "—")}</td><td>${fmtDate(p.payment_date)}</td>
        <td>${esc(w.no)}<br><small class="text-muted">${esc(w.name)}</small></td>
        <td>${esc(p.invoices?.invoice_number || "—")}</td><td>${money(p.amount)}</td><td>${pct}%</td>
        <td><small>${esc(p.payment_method || "")} ${esc(p.transaction_reference || "")}<br>${esc(p.notes || "")}</small></td>
        <td style="white-space:nowrap"><button class="btn small" data-ok="${n}">Approve</button>
        <button class="btn small danger" data-no="${n}">Reject</button></td></tr>`;
    }).join("") || '<tr><td colspan="8" class="text-muted">Nothing awaiting approval.</td></tr>';
    refreshBadge();
  }
  async function onApprovalClick(e) {
    const ok = e.target.closest("[data-ok]"), no = e.target.closest("[data-no]");
    if (!ok && !no) return;
    const p = PEND[(ok || no).dataset.ok ?? (ok || no).dataset.no];
    const w = who(p);
    if (ok) {
      if (!confirm("Approve " + money(p.amount) + " for " + w.name + "?")) return;
      const { error } = await LashawnDB.rpc("approve_payment", { p_payment_id: p.id });
      if (error) { toast(error.message); return; }
      showReceipt({
        receiptNumber: p.payment_number, receiptDate: p.payment_date,
        studentNumber: w.no, studentName: w.name,
        enrolmentNumber: p.enrolments?.enrolment_number || p.printing_jobs?.job_number || "—",
        programme: p.enrolments?.programme || (p.printing_jobs ? "PRINTING_DIGITAL" : "—"),
        description: "Fee payment", amount: p.amount, paymentMethod: p.payment_method, reference: p.transaction_reference,
      });
      toast("Payment approved");
    } else {
      const reason = prompt("Reason for rejecting this payment (e.g. M-Pesa code not found):");
      if (reason === null) return;
      const { error } = await LashawnDB.rpc("reject_payment", { p_payment_id: p.id, p_reason: reason });
      if (error) { toast(error.message); return; }
      toast("Payment rejected");
    }
    await loadApprovals(); loadStats(); loadFees();
  }

  /* ---------- Delete student ---------- */
  async function onDeleteClick(e) {
    const b = e.target.closest("[data-del]"); if (!b) return;
    const name = b.closest("tr").children[1].textContent;
    const t = prompt("Permanently delete " + name + " and their unpaid records?\nStudents with confirmed payments cannot be deleted.\n\nType DELETE to continue:");
    if (t !== "DELETE") return;
    const { error } = await LashawnDB.rpc("delete_student", { p_student_id: b.dataset.del });
    if (error) { toast(error.message); return; }
    toast("Student deleted");
    await Promise.all([loadTracker(), loadEnrolments(), loadFees()]); loadStats();
  }

  /* ---------- Activity log ---------- */
  let ACT = [], STAFF_BY_UID = {};
  async function loadActivity() {
    const [a, st] = await Promise.all([
      LashawnDB.from("audit_logs").select("created_at,user_id,action,table_name,record_id,old_data,new_data")
        .order("created_at", { ascending: false }).limit(300),
      LashawnDB.from("staff").select("auth_user_id,first_name,last_name,email,role"),
    ]);
    if (a.error) { toast(a.error.message); return; }
    STAFF_BY_UID = {}; (st.data || []).forEach((x) => { STAFF_BY_UID[x.auth_user_id] = x; });
    ACT = a.data || []; renderActivity();
  }
  function actWho(r) {
    const s = STAFF_BY_UID[r.user_id];
    return s ? s.first_name + " " + s.last_name + " (" + s.role + ")" : (r.user_id ? "Unknown user" : "System");
  }
  function actDetail(r) {
    const d = r.new_data || r.old_data || {};
    const ref = d.payment_number || d.invoice_number || d.enrolment_number || d.job_number || d.student_number || d.customer_number || "";
    const bits = [ref, d.first_name ? nm(d) : "", d.amount != null ? money(d.amount) : "", d.total_amount != null ? "Total " + money(d.total_amount) : "",
      d.amount_paid != null && d.total_amount != null ? "Paid " + money(d.amount_paid) : "", d.status || "", d.payment_method || "", d.notes || ""];
    if (r.action === "UPDATE" && r.old_data && r.new_data) {
      const ch = Object.keys(r.new_data).filter((k) => k !== "updated_at" && JSON.stringify(r.new_data[k]) !== JSON.stringify(r.old_data[k]));
      if (ch.length) return ch.map((k) => k + ": " + (r.old_data[k] ?? "—") + " → " + (r.new_data[k] ?? "—")).join("; ");
    }
    return bits.filter(Boolean).join(" · ");
  }
  function renderActivity() {
    const q = $("actSearch").value.toLowerCase(), t = $("actTable").value;
    const rows = ACT.filter((r) => (!t || r.table_name === t) &&
      (!q || (actWho(r) + " " + r.action + " " + r.table_name + " " + actDetail(r)).toLowerCase().includes(q)));
    $("act-table").innerHTML = rows.map((r) => `<tr>
      <td style="white-space:nowrap">${new Date(r.created_at).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}</td>
      <td>${esc(actWho(r))}</td><td>${esc(r.action)}</td><td>${esc(r.table_name)}</td>
      <td><small>${esc(actDetail(r)).slice(0, 220)}</small></td></tr>`).join("")
      || '<tr><td colspan="5" class="text-muted">No activity recorded yet.</td></tr>';
  }

  /* ---------- Office users ---------- */
  async function loadUsers() {
    const { data } = await LashawnDB.from("staff").select("staff_number,first_name,last_name,email,role,is_active").order("created_at");
    $("users-table").innerHTML = (data || []).map((s) => `<tr><td>${esc(s.staff_number)}</td>
      <td>${esc(s.first_name + " " + s.last_name)}</td><td>${esc(s.email || "—")}</td>
      <td><span class="tag-pill ${s.role === "SUPER_ADMIN" ? "super" : "office"}">${esc(s.role)}</span></td>
      <td>${s.is_active ? "✅ Active" : "❌ Inactive"}</td></tr>`).join("");
  }
  async function createUser(e) {
    e.preventDefault();
    const btn = $("uBtn"); btn.disabled = true; btn.textContent = "Creating...";
    try {
      const { data, error } = await LashawnDB.functions.invoke("create-office-user", {
        body: { first_name: $("uFirst").value.trim(), last_name: $("uLast").value.trim(),
                phone: $("uPhone").value.trim() || null, email: $("uEmail").value.trim().toLowerCase(),
                password: $("uPass").value },
      });
      if (error) {
        let msg = error.message;
        try { msg = (await error.context.json()).error || msg; } catch (_) {}
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
      toast("User created: " + data.email + " (" + data.staff_number + ")");
      $("userForm").reset(); loadUsers();
    } catch (err) { toast(err.message || "Could not create user"); }
    finally { btn.disabled = false; btn.textContent = "Create user"; }
  }
})();

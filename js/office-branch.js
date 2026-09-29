/* Office Admin add-on: branch dropdown, Walk-in Clients tab, receipt disclaimer.
   Add  <script src="office-branch.js"></script>  just before </body> in the Office Admin page. */
(function () {
  "use strict";
  if (typeof DB === "undefined" || !DB) return;
  const g = id => document.getElementById(id);
  let BR = {};

  /* 1. Branch dropdown (first field of the details card) */
  const grid = document.querySelector("#detailsCard .form-grid");
  if (grid) {
    const grp = document.createElement("div");
    grp.className = "form-group";
    grp.innerHTML = '<label>Branch *</label><select id="branch" required><option value="">Select Branch</option></select>';
    grid.prepend(grp);
  }
  DB.from("branches").select("id,branch_name").eq("is_active", true).order("branch_name").then(({ data, error }) => {
    if (error) { console.error("Branches:", error.message); return; }
    (data || []).forEach(b => { BR[b.id] = b.branch_name; });
    if (g("branch")) g("branch").innerHTML = '<option value="">Select Branch</option>' +
      (data || []).map(b => `<option value="${esc(b.id)}">${esc(b.branch_name)}</option>`).join("");
  });

  /* 2. Send the branch with student and walk-in saves */
  const rpc = DB.rpc.bind(DB);
  DB.rpc = async function (fn, args, opts) {
    const b = g("branch") ? g("branch").value || null : null;
    if (fn === "register_student") args = Object.assign({}, args, { p_branch_id: b });
    const res = await rpc(fn, args, opts);
    if (fn === "register_printing_job" && !res.error && b) {
      const r = Array.isArray(res.data) ? res.data[0] : res.data;
      if (r && r.job_number) await rpc("set_job_branch", { p_job_number: r.job_number, p_branch: b });
    }
    return res;
  };

  /* 3. Walk-in Clients tab */
  const stuBtn = document.querySelector('.nav button[data-panel="students"]');
  if (stuBtn) {
    stuBtn.textContent = "Students (Driving & Computer)";
    const btn = document.createElement("button");
    btn.dataset.panel = "clients";
    btn.textContent = "Walk-in Clients";
    stuBtn.insertAdjacentElement("afterend", btn);

    const sec = document.createElement("section");
    sec.className = "panel";
    sec.id = "panel-clients";
    sec.innerHTML = '<p class="lede">Walk-in clients: Printing, Cyber and Digital services.</p>' +
      '<div class="card"><div class="table-wrap"><table class="table"><thead><tr>' +
      '<th>Job No.</th><th>Customer</th><th>Phone</th><th>Branch</th><th>Date</th></tr></thead>' +
      '<tbody id="clientsTable"></tbody></table></div></div>';
    g("panel-students").insertAdjacentElement("afterend", sec);

    btn.addEventListener("click", async () => {
      document.querySelectorAll(".nav button").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      sec.classList.add("active");
      g("pageTitle").textContent = "Walk-in Clients";
      const { data, error } = await DB.from("printing_jobs")
        .select("*,printing_customers(customer_name,customer_number,phone)")
        .order("created_at", { ascending: false }).limit(500);
      if (error) { toast(error.message, false); return; }
      g("clientsTable").innerHTML = (data || []).length ? data.map(j => {
        const c = j.printing_customers || {};
        return `<tr><td>${esc(j.job_number)}</td><td>${esc(c.customer_number || "")} · ${esc(c.customer_name || "")}</td>` +
          `<td>${esc(c.phone || "—")}</td><td>${esc(BR[j.branch_id] || "—")}</td><td>${fmtDate(j.created_at)}</td></tr>`;
      }).join("") : empty(5, "No walk-in clients yet.");
    });
  }

  /* 4. Receipt disclaimer */
  const showR = window.showReceipt;
  if (typeof showR === "function") {
    window.showReceipt = function (d) {
      showR(d);
      g("receiptContent").insertAdjacentHTML("beforeend",
        '<p style="text-align:center;font-size:11px;font-weight:700;border:1px solid #999;padding:6px;margin-top:8px">' +
        'DISCLAIMER: Once payment is made, no refund is allowed after 48 hours.</p>');
    };
  }
})();

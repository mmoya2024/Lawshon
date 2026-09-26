/* ============================================================
   LASHAWN ACADEMY - PRINTING & BRANDING
   Works for BOTH:
   - public printing.html (catalog + quote form)
   - admin pages (services table + jobs table)
   ============================================================ */

document.addEventListener("DOMContentLoaded", async () => {
  // -------- PUBLIC PAGE: CATALOG --------
  if (document.getElementById("servicesCatalog")) {
    await renderPublicCatalog();
  }

  // -------- PUBLIC PAGE: QUOTE FORM --------
  if (document.getElementById("quoteForm")) {
    document.getElementById("quoteForm").addEventListener("submit", handleQuote);
  }

  // -------- ADMIN PAGE: SERVICES TABLE --------
  if (document.getElementById("servicesTable")) {
    await renderAdminServices();
  }

  // -------- ADMIN PAGE: JOBS TABLE --------
  if (document.getElementById("jobsTable")) {
    await renderAdminJobs();
  }
});

/* ------------------------------------------------------------
   PUBLIC CATALOG
   ------------------------------------------------------------ */
async function renderPublicCatalog() {
  const el = document.getElementById("servicesCatalog");
  try {
    const { data, error } = await LashawnDB
      .from("printing_services")
      .select("id, service_code, service_name, category, description, unit, unit_price")
      .eq("is_active", true)
      .order("category")
      .order("service_name");

    if (error) throw error;

    if (!data || data.length === 0) {
      el.innerHTML = `
        <div class="card">
          <p class="text-muted text-center">Service catalog coming soon. Contact us for pricing.</p>
        </div>`;
      return;
    }

    // Group by category
    const grouped = {};
    data.forEach((s) => {
      const cat = s.category || "General";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(s);
    });

    el.innerHTML = Object.entries(grouped)
      .map(
        ([cat, items]) => `
        <div class="card mb-3" style="padding:1.6rem;">
          <div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:1rem;">
            <span style="font-size:1.4rem;">${categoryIcon(cat)}</span>
            <h3 style="margin:0;color:var(--navy);font-size:1.1rem;">${cat}</h3>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Unit</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                ${items
                  .map(
                    (s) => `
                  <tr>
                    <td>
                      <strong>${s.service_name}</strong>
                      ${s.description ? `<br><small class="text-muted">${s.description}</small>` : ""}
                    </td>
                    <td>${s.unit || "ITEM"}</td>
                    <td><strong>KSh ${Number(s.unit_price).toLocaleString()}</strong></td>
                  </tr>`
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>`
      )
      .join("");
  } catch (err) {
    console.error("Catalog error:", err);
    el.innerHTML = `
      <div class="card">
        <p class="text-muted text-center">Could not load the catalog right now. Please call us for pricing.</p>
      </div>`;
  }
}

function categoryIcon(cat) {
  const map = {
    Printing: "📄",
    Photocopy: "📑",
    Digital: "💻",
    Design: "🎨",
    "Large Format": "🖼️",
    Branding: "👕",
    Signage: "🪧",
    Stationery: "📇",
    General: "🔧",
  };
  return map[cat] || "🔧";
}

/* ------------------------------------------------------------
   QUOTE FORM
   ------------------------------------------------------------ */
async function handleQuote(e) {
  e.preventDefault();
  const btn = document.getElementById("quoteBtn");
  const alertBox = document.getElementById("quoteAlert");

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Sending...';
  alertBox.innerHTML = "";

  const name = document.getElementById("qName").value.trim();
  const phone = document.getElementById("qPhone").value.trim();
  const email = document.getElementById("qEmail").value.trim();
  const service = document.getElementById("qService").value;
  const quantity = document.getElementById("qQuantity").value.trim();
  const deadline = document.getElementById("qDeadline").value;
  const description = document.getElementById("qDescription").value.trim();

  let details = `Service: ${service}\nPhone: ${phone}`;
  if (email) details += `\nEmail: ${email}`;
  if (quantity) details += `\nQuantity/Size: ${quantity}`;
  if (deadline) details += `\nDeadline: ${deadline}`;
  if (description) details += `\n\nNotes:\n${description}`;

  try {
    const { error } = await LashawnDB.from("notifications").insert({
      notification_type: "PRINTING_QUOTE_REQUEST",
      channel: "WEB",
      recipient: phone,
      subject: `Printing quote request: ${name} — ${service}`,
      message: details,
      status: "PENDING",
    });

    if (error) throw error;

    alertBox.innerHTML = `
      <div class="alert alert-success">
        <strong>Thanks, ${escapeHtml(name)}!</strong><br>
        We've received your request and will contact you on <strong>${escapeHtml(phone)}</strong> with a quote.
      </div>`;

    e.target.reset();
    window.scrollTo({ top: alertBox.offsetTop - 100, behavior: "smooth" });
  } catch (err) {
    console.error(err);
    alertBox.innerHTML = `
      <div class="alert alert-danger">
        Could not send your request right now. Please try again or call us directly.
      </div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = "Send Quote Request";
  }
}

/* ------------------------------------------------------------
   ADMIN: SERVICES TABLE
   ------------------------------------------------------------ */
async function renderAdminServices() {
  const el = document.getElementById("servicesTable");
  try {
    const { data, error } = await LashawnDB
      .from("printing_services")
      .select("*")
      .eq("is_active", true)
      .order("service_code");

    if (error) throw error;

    el.innerHTML = data && data.length
      ? `
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Code</th><th>Service</th><th>Category</th><th>Unit</th><th>Price</th></tr>
          </thead>
          <tbody>
            ${data
              .map(
                (s) => `
              <tr>
                <td>${s.service_code}</td>
                <td>${s.service_name}</td>
                <td>${s.category || "—"}</td>
                <td>${s.unit || "—"}</td>
                <td>KSh ${Number(s.unit_price).toLocaleString()}</td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>`
      : '<p class="text-muted">No services configured.</p>';
  } catch (err) {
    el.innerHTML = '<div class="alert alert-danger">Could not load services.</div>';
  }
}

/* ------------------------------------------------------------
   ADMIN: JOBS TABLE
   ------------------------------------------------------------ */
async function renderAdminJobs() {
  const el = document.getElementById("jobsTable");
  try {
    const { data, error } = await LashawnDB
      .from("printing_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    el.innerHTML = data && data.length
      ? `
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Job No.</th><th>Description</th><th>Qty</th><th>Balance</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${data
              .map(
                (j) => `
              <tr>
                <td>${j.job_number}</td>
                <td>${j.job_description || "—"}</td>
                <td>${j.quantity}</td>
                <td>KSh ${Number(j.balance).toLocaleString()}</td>
                <td><span class="badge badge-info">${j.status}</span></td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>`
      : '<p class="text-muted">No printing jobs yet.</p>';
  } catch (err) {
    el.innerHTML = '<div class="alert alert-danger">Could not load jobs.</div>';
  }
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

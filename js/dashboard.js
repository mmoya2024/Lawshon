/* ============================================================
   LASHAWN ACADEMY - DASHBOARD
   ============================================================ */

document.addEventListener("DOMContentLoaded", async () => {
  // Auth guard
  const session = await window.getSession();
  if (!session) {
    window.location.href = "login.html";
    return;
  }

  // Load user profile
  await loadUserProfile();

  // Load dashboard data
  await Promise.all([
    loadStats(),
    loadTrainingAlerts(),
    loadTestReady(),
    loadRecentActivity(),
  ]);
});

async function loadUserProfile() {
  try {
    const { data, error } = await LashawnDB.rpc("get_my_profile");
    if (error) throw error;

    if (data && data.first_name) {
      document.getElementById("userName").textContent =
        data.first_name + " " + (data.last_name || "");
    } else {
      document.getElementById("userName").textContent = "Staff";
    }
  } catch (err) {
    console.warn("Could not load profile:", err);
    document.getElementById("userName").textContent = "Staff";
  }
}

async function loadStats() {
  try {
    // Active students
    const { count: activeCount } = await LashawnDB
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("status", "ACTIVE");

    document.getElementById("statActiveStudents").textContent = activeCount ?? 0;

    // Training status from view
    const { data: training } = await LashawnDB
      .from("academy_student_training_status")
      .select("training_alert");

    const approaching = (training || []).filter(
      (t) => t.training_alert === "APPROACHING_6_WEEKS"
    ).length;
    const overdue = (training || []).filter(
      (t) => t.training_alert === "OVER_6_WEEKS"
    ).length;

    document.getElementById("statApproaching").textContent = approaching;
    document.getElementById("statOverdue").textContent = overdue;

    // Test ready
    const { count: readyCount } = await LashawnDB
      .from("test_readiness")
      .select("*", { count: "exact", head: true })
      .eq("overall_ready", true);

    document.getElementById("statReady").textContent = readyCount ?? 0;
  } catch (err) {
    console.error("Stats error:", err);
  }
}

async function loadTrainingAlerts() {
  const el = document.getElementById("trainingAlerts");
  try {
    const { data, error } = await LashawnDB
      .from("academy_student_training_status")
      .select("*")
      .in("training_alert", ["APPROACHING_6_WEEKS", "OVER_6_WEEKS"])
      .order("days_remaining", { ascending: true })
      .limit(10);

    if (error) throw error;

    if (!data || data.length === 0) {
      el.innerHTML = '<p class="text-muted">No students approaching or exceeding 6 weeks.</p>';
      return;
    }

    el.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Class</th>
              <th>Start Date</th>
              <th>Days Remaining</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${data
              .map(
                (r) => `
              <tr>
                <td>${r.student_number}<br><small class="text-muted">${r.student_name}</small></td>
                <td>${r.class_name || "—"}</td>
                <td>${r.start_date || "—"}</td>
                <td>${r.days_remaining ?? "—"}</td>
                <td>${
                  r.training_alert === "OVER_6_WEEKS"
                    ? '<span class="badge badge-danger">Over 6 Weeks</span>'
                    : '<span class="badge badge-warning">Approaching</span>'
                }</td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    console.error("Training alerts error:", err);
    el.innerHTML = '<p class="text-muted">Could not load training alerts.</p>';
  }
}

async function loadTestReady() {
  const el = document.getElementById("testReadyList");
  try {
    const { data, error } = await LashawnDB
      .from("students_due_for_test")
      .select("*")
      .limit(10);

    if (error) throw error;

    if (!data || data.length === 0) {
      el.innerHTML = '<p class="text-muted">No students currently marked as test-ready.</p>';
      return;
    }

    el.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Class</th>
              <th>Readiness</th>
              <th>Recommended Test Date</th>
            </tr>
          </thead>
          <tbody>
            ${data
              .map(
                (r) => `
              <tr>
                <td>${r.student_number}<br><small class="text-muted">${r.student_name}</small></td>
                <td>${r.class_name || "—"}</td>
                <td><span class="badge badge-success">${r.readiness_percentage}%</span></td>
                <td>${r.recommended_test_date || "—"}</td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    console.error("Test ready error:", err);
    el.innerHTML = '<p class="text-muted">Could not load test-ready students.</p>';
  }
}

async function loadRecentActivity() {
  const el = document.getElementById("recentActivity");
  try {
    const { data, error } = await LashawnDB
      .from("students")
      .select("student_number, first_name, last_name, created_at, status")
      .order("created_at", { ascending: false })
      .limit(8);

    if (error) throw error;

    if (!data || data.length === 0) {
      el.innerHTML = '<p class="text-muted">No recent activity.</p>';
      return;
    }

    el.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Student</th><th>Number</th><th>Status</th><th>Registered</th></tr>
          </thead>
          <tbody>
            ${data
              .map(
                (r) => `
              <tr>
                <td>${r.first_name} ${r.last_name}</td>
                <td>${r.student_number}</td>
                <td><span class="badge badge-${r.status === "ACTIVE" ? "success" : "neutral"}">${r.status}</span></td>
                <td>${new Date(r.created_at).toLocaleDateString()}</td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    console.error("Recent activity error:", err);
    el.innerHTML = '<p class="text-muted">Could not load recent activity.</p>';
  }
}

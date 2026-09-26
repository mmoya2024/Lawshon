/* LASHAWN ACADEMY - DRIVING */

document.addEventListener("DOMContentLoaded", async () => {
  const session = await window.getSession();
  if (!session) { window.location.href = "login.html"; return; }
  await Promise.all([loadTraining(), loadReadiness()]);
});

async function loadTraining() {
  const el = document.getElementById("trainingTable");
  try {
    const { data, error } = await LashawnDB
      .from("academy_student_training_status")
      .select("*")
      .order("days_remaining", { ascending: true });
    if (error) throw error;
    if (!data || data.length === 0) { el.innerHTML = '<p class="text-muted">No active driving enrolments.</p>'; return; }

    el.innerHTML = `
      <div class="table-wrap"><table>
        <thead><tr><th>Student</th><th>Class</th><th>Start</th><th>Expected End</th><th>Days Remaining</th><th>Alert</th></tr></thead>
        <tbody>
          ${data.map(r => `
            <tr>
              <td>${r.student_number}<br><small class="text-muted">${r.student_name}</small></td>
              <td>${r.class_name || "—"}</td>
              <td>${r.start_date || "—"}</td>
              <td>${r.expected_end_date || "—"}</td>
              <td>${r.days_remaining ?? "—"}</td>
              <td>${alertBadge(r.training_alert)}</td>
            </tr>`).join("")}
        </tbody>
      </table></div>`;
  } catch (err) {
    console.error(err);
    el.innerHTML = '<div class="alert alert-danger">Could not load training data.</div>';
  }
}

function alertBadge(a) {
  if (a === "OVER_6_WEEKS") return '<span class="badge badge-danger">Over 6 Weeks</span>';
  if (a === "APPROACHING_6_WEEKS") return '<span class="badge badge-warning">Approaching</span>';
  return '<span class="badge badge-success">On Track</span>';
}

async function loadReadiness() {
  const el = document.getElementById("readinessTable");
  try {
    const { data, error } = await LashawnDB
      .from("students_due_for_test")
      .select("*");
    if (error) throw error;
    if (!data || data.length === 0) { el.innerHTML = '<p class="text-muted">No students are currently test-ready.</p>'; return; }

    el.innerHTML = `
      <div class="table-wrap"><table>
        <thead><tr><th>Student</th><th>Class</th><th>Readiness</th><th>Recommended Test Date</th></tr></thead>
        <tbody>
          ${data.map(r => `
            <tr>
              <td>${r.student_number}<br><small class="text-muted">${r.student_name}</small></td>
              <td>${r.class_name || "—"}</td>
              <td><span class="badge badge-success">${r.readiness_percentage}%</span></td>
              <td>${r.recommended_test_date || "—"}</td>
            </tr>`).join("")}
        </tbody>
      </table></div>`;
  } catch (err) {
    console.error(err);
    el.innerHTML = '<div class="alert alert-danger">Could not load readiness data.</div>';
  }
}

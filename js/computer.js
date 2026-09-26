document.addEventListener("DOMContentLoaded", async () => {
  const session = await window.getSession();
  if (!session) { window.location.href = "login.html"; return; }

  const el = document.getElementById("coursesTable");
  try {
    const { data, error } = await LashawnDB.from("computer_courses").select("*").eq("is_active", true);
    if (error) throw error;
    if (!data || data.length === 0) { el.innerHTML = '<p class="text-muted">No courses available.</p>'; return; }
    el.innerHTML = `
      <div class="table-wrap"><table>
        <thead><tr><th>Code</th><th>Course</th><th>Duration</th><th>Fee</th></tr></thead>
        <tbody>
          ${data.map(c => `<tr><td>${c.course_code}</td><td>${c.course_name}</td><td>${c.duration_weeks || "—"} weeks</td><td>KSh ${Number(c.fee).toLocaleString()}</td></tr>`).join("")}
        </tbody>
      </table></div>`;
  } catch (err) { el.innerHTML = '<div class="alert alert-danger">Could not load courses.</div>'; }

  document.getElementById("progressTable").innerHTML = '<p class="text-muted">Progress tracking available per enrolment.</p>';
});

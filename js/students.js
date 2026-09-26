/* ============================================================
   LASHAWN ACADEMY - STUDENTS
   ============================================================ */

let allStudents = [];
let drivingClasses = [];
let computerCourses = [];

document.addEventListener("DOMContentLoaded", async () => {
  const session = await window.getSession();
  if (!session) {
    window.location.href = "login.html";
    return;
  }

  // Set default start date
  document.getElementById("regStartDate").value = new Date()
    .toISOString()
    .split("T")[0];

  // Programme toggle
  document.getElementById("regProgramme").addEventListener("change", (e) => {
    const val = e.target.value;
    document
      .getElementById("drivingClassGroup")
      .classList.toggle("hidden", val !== "DRIVING");
    document
      .getElementById("computerCourseGroup")
      .classList.toggle("hidden", val !== "COMPUTER");
  });

  // Register form submit
  document
    .getElementById("registerForm")
    .addEventListener("submit", handleRegister);

  // Search / filter
  document.getElementById("searchInput").addEventListener("input", renderStudents);
  document.getElementById("statusFilter").addEventListener("change", renderStudents);

  // Load reference data + students
  await Promise.all([
    loadDrivingClasses(),
    loadComputerCourses(),
    loadStudents(),
  ]);
});

async function loadDrivingClasses() {
  try {
    const { data, error } = await LashawnDB
      .from("driving_classes")
      .select("id, class_code, class_name")
      .eq("is_active", true)
      .order("class_code");

    if (error) throw error;
    drivingClasses = data || [];

    const sel = document.getElementById("regDrivingClass");
    drivingClasses.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = `${c.class_code} — ${c.class_name}`;
      sel.appendChild(opt);
    });
  } catch (err) {
    console.warn("Could not load driving classes:", err);
  }
}

async function loadComputerCourses() {
  try {
    const { data, error } = await LashawnDB
      .from("computer_courses")
      .select("id, course_code, course_name")
      .eq("is_active", true)
      .order("course_code");

    if (error) throw error;
    computerCourses = data || [];

    const sel = document.getElementById("regComputerCourse");
    computerCourses.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = `${c.course_code} — ${c.course_name}`;
      sel.appendChild(opt);
    });
  } catch (err) {
    console.warn("Could not load computer courses:", err);
  }
}

async function loadStudents() {
  try {
    const { data, error } = await LashawnDB
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    allStudents = data || [];
    renderStudents();
  } catch (err) {
    console.error("Load students error:", err);
    document.getElementById("studentsTable").innerHTML =
      '<div class="alert alert-danger">Could not load students.</div>';
  }
}

function renderStudents() {
  const el = document.getElementById("studentsTable");
  const q = document.getElementById("searchInput").value.trim().toLowerCase();
  const status = document.getElementById("statusFilter").value;

  let filtered = allStudents;

  if (q) {
    filtered = filtered.filter((s) => {
      const name = `${s.first_name} ${s.last_name}`.toLowerCase();
      return (
        name.includes(q) ||
        (s.phone || "").includes(q) ||
        (s.student_number || "").toLowerCase().includes(q)
      );
    });
  }

  if (status) {
    filtered = filtered.filter((s) => s.status === status);
  }

  if (filtered.length === 0) {
    el.innerHTML = '<p class="text-muted">No students found.</p>';
    return;
  }

  el.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Student No.</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Registered</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${filtered
            .map(
              (s) => `
            <tr>
              <td><strong>${s.student_number}</strong></td>
              <td>${s.first_name} ${s.last_name}</td>
              <td>${s.phone || "—"}</td>
              <td><span class="badge badge-${statusBadge(s.status)}">${s.status}</span></td>
              <td>${s.registration_date || new Date(s.created_at).toLocaleDateString()}</td>
              <td>
                <div class="actions">
                  <a class="btn small secondary" href="student-profile.html?id=${s.id}">View</a>
                </div>
              </td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function statusBadge(status) {
  switch (status) {
    case "ACTIVE": return "success";
    case "COMPLETED": return "info";
    case "SUSPENDED": return "warning";
    case "WITHDRAWN": return "danger";
    default: return "neutral";
  }
}

function openRegisterModal() {
  document.getElementById("registerModal").classList.add("active");
  document.getElementById("modalAlert").innerHTML = "";
}

function closeRegisterModal() {
  document.getElementById("registerModal").classList.remove("active");
  document.getElementById("registerForm").reset();
  document.getElementById("drivingClassGroup").classList.add("hidden");
  document.getElementById("computerCourseGroup").classList.add("hidden");
  document.getElementById("regStartDate").value = new Date()
    .toISOString()
    .split("T")[0];
}

async function handleRegister(e) {
  e.preventDefault();
  const btn = document.getElementById("registerBtn");
  const alertBox = document.getElementById("modalAlert");

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Registering...';
  alertBox.innerHTML = "";

  const firstName = document.getElementById("regFirstName").value.trim();
  const lastName = document.getElementById("regLastName").value.trim();
  const phone = document.getElementById("regPhone").value.trim();
  const email = document.getElementById("regEmail").value.trim() || null;
  const idNumber = document.getElementById("regIdNumber").value.trim() || null;
  const programme = document.getElementById("regProgramme").value;
  const drivingClassId =
    document.getElementById("regDrivingClass").value || null;
  const computerCourseId =
    document.getElementById("regComputerCourse").value || null;
  const startDate = document.getElementById("regStartDate").value || null;
  const notes = document.getElementById("regNotes").value.trim() || null;

  try {
    const { data, error } = await LashawnDB.rpc("register_student", {
      p_first_name: firstName,
      p_last_name: lastName,
      p_phone: phone,
      p_email: email,
      p_id_number: idNumber,
      p_programme: programme,
      p_driving_class_id: drivingClassId,
      p_computer_course_id: computerCourseId,
      p_branch_id: null,
      p_start_date: startDate,
      p_notes: notes,
    });

    if (error) throw error;

    alertBox.innerHTML =
      '<div class="alert alert-success">' +
      `Student registered: <strong>${data.student_number}</strong> · Enrolment: <strong>${data.enrolment_number}</strong>` +
      "</div>";

    setTimeout(async () => {
      closeRegisterModal();
      await loadStudents();
    }, 1800);
  } catch (err) {
    console.error(err);
    alertBox.innerHTML =
      '<div class="alert alert-danger">' +
      (err.message || "Registration failed.") +
      "</div>";
  } finally {
    btn.disabled = false;
    btn.textContent = "Register Student";
  }
}

/* ============================================================
   LASHAWN ACADEMY - PUBLIC ENROLMENT
   ============================================================ */

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("enrollForm");
  const programmeSelect = document.getElementById("eProgramme");

  // Programme toggle
  programmeSelect.addEventListener("change", (e) => {
    const val = e.target.value;
    document.getElementById("eDrivingClassGroup").classList.toggle("hidden", val !== "DRIVING");
    document.getElementById("eComputerCourseGroup").classList.toggle("hidden", val !== "COMPUTER");
  });

  // Load reference data
  await Promise.all([loadDrivingClasses(), loadComputerCourses()]);

  // Submit
  form.addEventListener("submit", handleSubmit);
});

async function loadDrivingClasses() {
  try {
    const { data, error } = await LashawnDB
      .from("driving_classes")
      .select("id, class_code, class_name, minimum_age")
      .eq("is_active", true)
      .order("class_code");
    if (error) throw error;
    const sel = document.getElementById("eDrivingClass");
    (data || []).forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.class_code;
      opt.textContent = `${c.class_code} — ${c.class_name}${c.minimum_age ? ` (age ${c.minimum_age}+)` : ""}`;
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
      .select("id, course_code, course_name, duration_weeks, fee")
      .eq("is_active", true)
      .order("course_code");
    if (error) throw error;
    const sel = document.getElementById("eComputerCourse");
    (data || []).forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.course_code;
      opt.textContent = `${c.course_name}${c.duration_weeks ? ` · ${c.duration_weeks}w` : ""}${c.fee ? ` · KSh ${Number(c.fee).toLocaleString()}` : ""}`;
      sel.appendChild(opt);
    });
  } catch (err) {
    console.warn("Could not load computer courses:", err);
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById("enrollBtn");
  const alertBox = document.getElementById("enrollAlert");

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Submitting...';
  alertBox.innerHTML = "";

  const name = document.getElementById("eName").value.trim();
  const phone = document.getElementById("ePhone").value.trim();
  const email = document.getElementById("eEmail").value.trim();
  const idNumber = document.getElementById("eIdNumber").value.trim();
  const programme = document.getElementById("eProgramme").value;
  const drivingClass = document.getElementById("eDrivingClass").value;
  const computerCourse = document.getElementById("eComputerCourse").value;
  const message = document.getElementById("eMessage").value.trim();

  // Build a structured message for staff to review
  let details = `Programme: ${programme}\nPhone: ${phone}`;
  if (email) details += `\nEmail: ${email}`;
  if (idNumber) details += `\nID/Passport: ${idNumber}`;
  if (programme === "DRIVING" && drivingClass) details += `\nDriving Class: ${drivingClass}`;
  if (programme === "COMPUTER" && computerCourse) details += `\nComputer Course: ${computerCourse}`;
  if (message) details += `\n\nMessage:\n${message}`;

  try {
    const { error } = await LashawnDB.from("notifications").insert({
      notification_type: "ENROLLMENT_ENQUIRY",
      channel: "WEB",
      recipient: phone,
      subject: `New enrolment enquiry: ${name}`,
      message: details,
      status: "PENDING",
    });

    if (error) throw error;

    alertBox.innerHTML = `
      <div class="alert alert-success">
        <strong>Thank you, ${escapeHtml(name)}!</strong><br>
        We have received your enquiry and will contact you on <strong>${escapeHtml(phone)}</strong> shortly.
      </div>`;

    e.target.reset();
    document.getElementById("eDrivingClassGroup").classList.add("hidden");
    document.getElementById("eComputerCourseGroup").classList.add("hidden");

    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    console.error(err);
    alertBox.innerHTML = `
      <div class="alert alert-danger">
        Could not submit your enquiry right now. Please try again or call us directly.
      </div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = "Submit Enquiry";
  }
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

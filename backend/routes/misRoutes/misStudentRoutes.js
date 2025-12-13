const express = require("express");
const router = express.Router();
const verifyMISStudent = require("../../middleware/verifyMISStudent");
const pool = require("../../db/misDB/pool");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");

//
// ✅ Get student profile + course and subjects
//
router.get("/profile", verifyMISStudent, async (req, res) => {
  try {
    const { email } = req.user;

    const studentResult = await pool.query(
      `SELECT s.*, c.course_name
       FROM students s
       LEFT JOIN courses c ON s.course_id = c.course_id
       WHERE s.email = $1`,
      [email]
    );

    if (studentResult.rows.length === 0)
      return res.status(404).json({ error: "Student not found" });

    const student = studentResult.rows[0];

    const subjectsResult = await pool.query(
      `SELECT subject_name FROM subjects WHERE course_id = $1`,
      [student.course_id]
    );

    res.json({
      student,
      subjects: subjectsResult.rows.map((s) => s.subject_name),
    });
  } catch (err) {
    console.error("Error fetching student profile:", err);
    res.status(500).json({ error: "Server error" });
  }
});

//
// ✅ Get subjects available for student’s course (for selection)
//
router.get("/subjects", verifyMISStudent, async (req, res) => {
  try {
    const { mis_id } = req.user;

    const student = await pool.query(
      "SELECT course_id FROM students WHERE mis_id=$1",
      [mis_id]
    );
    if (student.rows.length === 0)
      return res.status(404).json({ error: "Student not found" });

    const courseId = student.rows[0].course_id;

    const subjects = await pool.query(
      "SELECT subject_id, subject_name FROM subjects WHERE course_id=$1",
      [courseId]
    );

    const enrolled = await pool.query(
      "SELECT subject_id FROM enrollments WHERE mis_id=$1 AND semester=1",
      [mis_id]
    );

    const enrolledIds = enrolled.rows.map((r) => r.subject_id);

    res.json({ subjects: subjects.rows, enrolled: enrolledIds });
  } catch (err) {
    console.error("Error fetching subjects:", err);
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
});

//
// ✅ Save selected subjects for this semester
//
router.post("/subjects", verifyMISStudent, async (req, res) => {
  try {
    const { mis_id } = req.user;
    const { selectedSubjects } = req.body;

    if (!Array.isArray(selectedSubjects) || selectedSubjects.length === 0)
      return res.status(400).json({ error: "No subjects selected" });

    if (selectedSubjects.length > 5)
      return res.status(400).json({ error: "You can select only 5 subjects" });

    // Remove old entries and insert new ones
    await pool.query("DELETE FROM enrollments WHERE mis_id=$1 AND semester=1", [
      mis_id,
    ]);

    for (const subjectId of selectedSubjects) {
      await pool.query(
        "INSERT INTO enrollments (mis_id, subject_id, semester) VALUES ($1, $2, 1)",
        [mis_id, subjectId]
      );
    }

    res.json({ message: "Subjects saved for this semester!" });
  } catch (err) {
    console.error("Error saving subjects:", err);
    res.status(500).json({ error: "Failed to save subjects" });
  }
});

//
// ✅ Get student's enrolled subjects with marks + attendance + instructor
//
router.get("/enrollments", verifyMISStudent, async (req, res) => {
  try {
    const { mis_id } = req.user;

    const result = await pool.query(
      `SELECT 
         e.semester,
         s.subject_name,
         t.full_name AS instructor_name,
         e.lectures_attended,
         e.total_lectures,
         e.midsem_marks,
         e.endsem_marks,
         e.internal_marks
       FROM enrollments e
       JOIN subjects s ON e.subject_id = s.subject_id
       LEFT JOIN teachers t ON s.teacher_id = t.teacher_id
       WHERE e.mis_id = $1 AND e.semester = 1
       ORDER BY s.subject_name`,
      [mis_id]
    );

    res.json({ enrolledSubjects: result.rows });
  } catch (err) {
    console.error("Error fetching enrollments:", err);
    res.status(500).json({ error: "Failed to fetch enrollments" });
  }
});

//
// 🆕 ✅ Generate Certificates / Cards (bonafide, librarycard, idcard — no photo)
//
router.get("/certificate/:type", verifyMISStudent, async (req, res) => {
  try {
    const { type } = req.params;
    const { mis_id } = req.user;

    // Fetch student info
    const result = await pool.query(
      `SELECT s.*, c.course_name
       FROM students s
       LEFT JOIN courses c ON s.course_id = c.course_id
       WHERE s.mis_id = $1`,
      [mis_id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Student not found" });

    const s = result.rows[0];
    const today = new Date().toLocaleDateString("en-IN");

    // Construct full name safely
    const fullName = [s.firstname, s.middlename, s.lastname]
      .filter(Boolean)
      .join(" ");
    s.full_name = fullName;

    // Create PDF
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${type}_${s.mis_id}.pdf"`
    );
    doc.pipe(res);

    // Common header
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("COEP TECHNOLOGICAL UNIVERSITY", { align: "center" });
    doc.fontSize(12).text("(An Autonomous Institute of Govt. of Maharashtra)", {
      align: "center",
    });
    doc.moveDown(2);

    // Generate certificate by type
    switch (type.toLowerCase()) {
      case "bonafide":
        doc
          .fontSize(18)
          .font("Helvetica-Bold")
          .text("BONAFIDE CERTIFICATE", { align: "center", underline: true });

        doc.moveDown(2);

        doc
          .fontSize(13)
          .font("Helvetica")
          .text(
            `This is to certify that Mr./Ms. ${s.full_name} (MIS ID: ${s.mis_id}) 
      is a bonafide student of COEP Technological University enrolled in the ${s.course_name} program. 
      He/She is studying in the academic year 2025–26.`,
            { align: "justify", lineGap: 6 }
          );

        doc.moveDown(2);
        doc.text(`Issued on ${today} for official use.`, { align: "justify" });

        // -------------------------------------------
        // ADD SIGNATURE + STAMP IMAGES HERE
        // -------------------------------------------

        try {
          doc.image("public/assets/sign.png", 60, 560, {
            width: 120, // adjust for size
          });

          doc.image("public/assets/verified.jpg", 380, 540, {
            width: 120,
          });
        } catch (err) {
          console.log("Image load error:", err);
        }

        // Lines and titles
        doc.text("__________________________", 60, 600);
        doc.text("Head of Department", 80, 615);
        doc.text("Seal of Institute", 410, 615);

        break;

      case "librarycard":
        doc
          .fontSize(18)
          .font("Helvetica-Bold")
          .text("LIBRARY CARD", { align: "center", underline: true });
        doc.moveDown(2);
        doc.rect(100, 200, 400, 200).stroke();
        doc.fontSize(12).text(`Name: ${s.full_name}`, 120, 220);
        doc.text(`Course: ${s.course_name}`, 120, 250);
        doc.text(`MIS ID: ${s.mis_id}`, 120, 280);
        doc.text(`Valid Till: Dec 2026`, 120, 310);

        const qrData = `LibraryCard:${s.mis_id}`;
        const qr = await QRCode.toDataURL(qrData);
        const qrBuffer = Buffer.from(qr.split(",")[1], "base64");
        doc.image(qrBuffer, 400, 230, { width: 80 });
        doc.moveDown(5);
        doc.text(`Issued on ${today}`, { align: "center" });
        break;

      case "idcard":
        doc
          .fontSize(18)
          .font("Helvetica-Bold")
          .text("STUDENT ID CARD", { align: "center", underline: true });
        doc.moveDown(2);
        doc.rect(100, 200, 400, 200).stroke(); // compact ID card, no photo
        doc.fontSize(12).text(`Name: ${s.full_name}`, 120, 220);
        doc.text(`Course: ${s.course_name}`, 120, 250);
        doc.text(
          `DOB: ${new Date(s.dob).toLocaleDateString("en-IN")}`,
          120,
          280
        );
        doc.text(`MIS ID: ${s.mis_id}`, 120, 310);
        doc.text(`Validity: July 2025 – June 2026`, 120, 340);
        doc.moveDown(6);
        doc.text(`Issued on ${today}`, { align: "center" });
        break;

      default:
        doc.fontSize(14).text("Invalid certificate type", { align: "center" });
        break;
    }

    doc.end();
  } catch (err) {
    console.error("Error generating certificate:", err);
    res.status(500).json({ error: "Failed to generate certificate" });
  }
});

module.exports = router;

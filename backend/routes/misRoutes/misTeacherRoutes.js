const express = require("express");
const router = express.Router();
const verifyMISTeacher = require("../../middleware/verifyMISTeacher");
const pool = require("../../db/misDB/pool");

// ✅ 1️⃣ Get teacher profile + subjects they teach
router.get("/profile", verifyMISTeacher, async (req, res) => {
  try {
    const { email } = req.user;

    const teacherResult = await pool.query(
      `SELECT t.*, 
              ARRAY_AGG(s.subject_name) AS subjects
       FROM teachers t
       LEFT JOIN subjects s ON t.teacher_id = s.teacher_id
       WHERE t.email = $1
       GROUP BY t.teacher_id`,
      [email]
    );

    if (teacherResult.rows.length === 0)
      return res.status(404).json({ error: "Teacher not found" });

    res.json({ teacher: teacherResult.rows[0] });
  } catch (err) {
    console.error("Error fetching teacher profile:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ 2️⃣ Get all subjects taught by the logged-in teacher
router.get("/subjects", verifyMISTeacher, async (req, res) => {
  try {
    const { email } = req.user;

    const result = await pool.query(
      `SELECT s.subject_id, s.subject_name, c.course_name
       FROM subjects s
       JOIN courses c ON s.course_id = c.course_id
       JOIN teachers t ON s.teacher_id = t.teacher_id
       WHERE t.email = $1`,
      [email]
    );

    res.json({ subjects: result.rows });
  } catch (err) {
    console.error("Error fetching teacher subjects:", err);
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
});

// ✅ 3️⃣ Get all students enrolled in a particular subject
router.get("/subject/:id/students", verifyMISTeacher, async (req, res) => {
  try {
    const subjectId = req.params.id;

    const result = await pool.query(
      `SELECT s.mis_id, s.firstname, s.lastname, s.email,
              e.semester, e.lectures_attended, e.total_lectures,
              e.midsem_marks, e.endsem_marks, e.internal_marks
       FROM enrollments e
       JOIN students s ON e.mis_id = s.mis_id
       WHERE e.subject_id = $1
       ORDER BY s.firstname`,
      [subjectId]
    );

    res.json({ students: result.rows });
  } catch (err) {
    console.error("Error fetching subject students:", err);
    res.status(500).json({ error: "Failed to fetch enrolled students" });
  }
});

// ✅ 4️⃣ Mark attendance (present / absent)
router.post("/subject/:id/attendance", verifyMISTeacher, async (req, res) => {
  try {
    const { mis_id, status } = req.body;
    const subjectId = req.params.id;

    if (!mis_id || !status)
      return res.status(400).json({ error: "Missing required fields" });

    if (!["present", "absent"].includes(status))
      return res.status(400).json({ error: "Invalid attendance status" });

    await pool.query(
      `UPDATE enrollments
       SET total_lectures = total_lectures + 1,
           lectures_attended = lectures_attended + CASE WHEN $1 = 'present' THEN 1 ELSE 0 END
       WHERE mis_id = $2 AND subject_id = $3`,
      [status, mis_id, subjectId]
    );

    res.json({ message: `Attendance marked as ${status}` });
  } catch (err) {
    console.error("Error updating attendance:", err);
    res.status(500).json({ error: "Failed to mark attendance" });
  }
});

// ✅ 5️⃣ Update marks (midsem / endsem / internal)
router.post("/subject/:id/marks", verifyMISTeacher, async (req, res) => {
  try {
    const { mis_id, type, marks } = req.body;
    const subjectId = req.params.id;

    if (!mis_id || !type || marks == null)
      return res.status(400).json({ error: "Missing fields" });

    const validTypes = ["midsem", "endsem", "internal"];
    if (!validTypes.includes(type))
      return res.status(400).json({ error: "Invalid mark type" });

    const column = `${type}_marks`;

    await pool.query(
      `UPDATE enrollments SET ${column} = $1 WHERE mis_id = $2 AND subject_id = $3`,
      [marks, mis_id, subjectId]
    );

    res.json({ message: `${type} marks updated successfully` });
  } catch (err) {
    console.error("Error updating marks:", err);
    res.status(500).json({ error: "Failed to update marks" });
  }
});

module.exports = router;

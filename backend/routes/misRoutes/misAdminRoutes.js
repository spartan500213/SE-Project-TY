const express = require("express");
const router = express.Router();
const verifyMISAdmin = require("../../middleware/verifyMISAdmin");
const pool = require("../../db/misDB/pool");

//
// ✅ 1️⃣ Get all students
//
router.get("/students", verifyMISAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.mis_id, s.firstname, s.middlename, s.lastname, 
              s.email, s.phone, c.course_name, 
              s.fee_status, s.is_scholarship
       FROM students s
       LEFT JOIN courses c ON s.course_id = c.course_id
       ORDER BY s.mis_id`
    );

    res.json({ students: result.rows });
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

//
// ✅ 2️⃣ Get all teachers
//
router.get("/teachers", verifyMISAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT teacher_id, full_name, email, phone, joined_on
       FROM teachers
       ORDER BY teacher_id`
    );

    res.json({ teachers: result.rows });
  } catch (err) {
    console.error("Error fetching teachers:", err);
    res.status(500).json({ error: "Failed to fetch teachers" });
  }
});

//
// ✅ 3️⃣ Get all courses
//
router.get("/courses", verifyMISAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT course_id, course_name, course_code, duration
       FROM courses
       ORDER BY course_id`
    );

    res.json({ courses: result.rows });
  } catch (err) {
    console.error("Error fetching courses:", err);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

//
// ✅ 4️⃣ Get all subjects (with linked course & teacher)
//
router.get("/subjects", verifyMISAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.subject_id, s.subject_name,
              c.course_name,
              t.full_name AS teacher_name
       FROM subjects s
       LEFT JOIN courses c ON s.course_id = c.course_id
       LEFT JOIN teachers t ON s.teacher_id = t.teacher_id
       ORDER BY s.subject_id`
    );

    res.json({ subjects: result.rows });
  } catch (err) {
    console.error("Error fetching subjects:", err);
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
});

//
// ✅ 5️⃣ Add a new course
//
router.post("/course", verifyMISAdmin, async (req, res) => {
  try {
    const { course_name, course_code, duration } = req.body;

    if (!course_name || !course_code || !duration)
      return res.status(400).json({ error: "Missing course details" });

    await pool.query(
      `INSERT INTO courses (course_name, course_code, duration)
       VALUES ($1, $2, $3)`,
      [course_name, course_code, duration]
    );

    res.json({ message: "Course added successfully" });
  } catch (err) {
    console.error("Error adding course:", err);
    res.status(500).json({ error: "Failed to add course" });
  }
});

//
// ✅ 6️⃣ Add a new teacher
//
//
// ✅ 6️⃣ Add a new teacher (with users table entry)
//
router.post("/teacher", verifyMISAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const { full_name, email, phone, joined_on } = req.body;

    if (!full_name || !email || !phone)
      return res.status(400).json({ error: "Missing teacher details" });

    await client.query("BEGIN");

    // Generate unique MIS ID for teacher
    const countRes = await client.query("SELECT COUNT(*) FROM teachers");
    const nextId = String(parseInt(countRes.rows[0].count) + 1).padStart(
      4,
      "0"
    );
    const misId = `MIS-TEA-${nextId}`;

    // Insert into teachers table
    await client.query(
      `INSERT INTO teachers (full_name, email, phone, joined_on)
       VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE))`,
      [full_name, email, phone, joined_on]
    );

    // Default password (can be reset later)
    const bcrypt = require("bcryptjs");
    const defaultPassword = "teacher123";
    const hash = await bcrypt.hash(defaultPassword, 10);

    // Insert into users table
    await client.query(
      `INSERT INTO users (email, password_hash, role, mis_id)
       VALUES ($1, $2, 'teacher', $3)`,
      [email, hash, misId]
    );

    await client.query("COMMIT");

    res.json({
      message: `Teacher added successfully. Default password is '${defaultPassword}'.`,
      mis_id: misId,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error adding teacher:", err);
    res.status(500).json({ error: "Failed to add teacher" });
  } finally {
    client.release();
  }
});

//
// ✅ 7️⃣ Add a new subject
//
router.post("/subject", verifyMISAdmin, async (req, res) => {
  try {
    const { subject_name, course_id, teacher_id } = req.body;

    if (!subject_name || !course_id || !teacher_id)
      return res.status(400).json({ error: "Missing subject details" });

    await pool.query(
      `INSERT INTO subjects (subject_name, course_id, teacher_id)
       VALUES ($1, $2, $3)`,
      [subject_name, course_id, teacher_id]
    );

    res.json({ message: "Subject added successfully" });
  } catch (err) {
    console.error("Error adding subject:", err);
    res.status(500).json({ error: "Failed to add subject" });
  }
});

//
// ✅ 8️⃣ Delete a course / subject / teacher
//
router.delete("/:entity/:id", verifyMISAdmin, async (req, res) => {
  try {
    const { entity, id } = req.params;
    const valid = ["courses", "subjects", "teachers"];
    if (!valid.includes(entity))
      return res.status(400).json({ error: "Invalid entity type" });

    await pool.query(
      `DELETE FROM ${entity} WHERE ${entity.slice(0, -1)}_id = $1`,
      [id]
    );

    res.json({ message: `${entity.slice(0, -1)} deleted successfully` });
  } catch (err) {
    console.error("Error deleting record:", err);
    res.status(500).json({ error: "Failed to delete record" });
  }
});

module.exports = router;

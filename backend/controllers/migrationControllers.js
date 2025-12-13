const appPool = require("../db/applicationDB/pool");
const misPool = require("../db/misDB/pool");
const bcrypt = require("bcryptjs");

exports.migrateConfirmedStudents = async (req, res) => {
  try {
    // 1️⃣ Fetch confirmed applications from admissions DB
    const confirmed = await appPool.query(
      "SELECT * FROM applications WHERE admission_status = 'confirmed'"
    );

    if (confirmed.rows.length === 0) {
      return res.status(404).json({ error: "No confirmed applications found" });
    }

    // 2️⃣ Fetch all course mappings from MIS DB
    const courses = await misPool.query(
      "SELECT course_id, course_name FROM courses"
    );

    const courseMap = {};
    courses.rows.forEach((c) => {
      const normalized = c.course_name.toLowerCase().replace(/[^a-z0-9]/g, "");
      courseMap[normalized] = c.course_id;
    });

    // 3️⃣ Get how many students already exist, to continue MIS ID sequence
    const existingStudentsRes = await misPool.query(
      "SELECT COUNT(*) AS count FROM students"
    );
    let baseIndex = parseInt(existingStudentsRes.rows[0].count, 10) || 0;

    let migratedCount = 0;

    // 4️⃣ Loop through each confirmed application
    for (const app of confirmed.rows) {
      // 🔍 Skip if student already exists in MIS.students
      const existingStudent = await misPool.query(
        "SELECT 1 FROM students WHERE email = $1",
        [app.email]
      );
      if (existingStudent.rows.length > 0) {
        console.log(`⏩ Skipping (student exists in MIS): ${app.email}`);
        continue;
      }

      // 🔍 Skip if user already exists in MIS.users
      const existingUser = await misPool.query(
        "SELECT 1 FROM users WHERE email = $1",
        [app.email]
      );
      if (existingUser.rows.length > 0) {
        console.log(`⏩ Skipping (user exists in MIS): ${app.email}`);
        continue;
      }

      // 🧮 Map course name → course_id
      const normalizedCourse = app.course
        ?.toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      const courseId = courseMap[normalizedCourse];

      if (!courseId) {
        console.warn(`⚠️ No matching course found for: "${app.course}"`);
        continue;
      }

      // 🔐 Get existing password hash from admissions DB
      const userResult = await appPool.query(
        "SELECT password_hash FROM users WHERE id=$1",
        [app.user_id]
      );
      const existingHash = userResult.rows[0]?.password_hash;

      if (!existingHash) {
        console.warn(`⚠️ Missing password hash for user_id ${app.user_id}`);
        continue;
      }

      // 🆔 Generate MIS ID continuing from existing students
      const serial = baseIndex + migratedCount + 1;
      const misId = `MIS${new Date().getFullYear()}-COEP-${String(
        serial
      ).padStart(3, "0")}`;

      // 5️⃣ Insert into MIS.users (brand new only)
      const userInsert = await misPool.query(
        `INSERT INTO users (email, password_hash, role, mis_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [app.email, existingHash, "student", misId]
      );

      const newUserId = userInsert.rows[0].id;

      // 6️⃣ Insert into MIS.students (brand new only)
      await misPool.query(
        `INSERT INTO students (
          mis_id, user_id, email, firstname, middlename, lastname, dob, phone, address,
          is_scholarship, fee_status, id_document_path, merit_document, course_id,
          payment_order_id, payment_id, payment_signature, payment_amount, payment_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19
        )`,
        [
          misId,
          newUserId,
          app.email,
          app.firstname,
          app.middlename,
          app.lastname,
          app.dob,
          app.phone,
          app.address,
          app.is_scholarship,
          app.fee_status,
          app.id_document_path, // 👈 make sure this matches your column rename
          app.merit_document,
          courseId,
          app.payment_order_id,
          app.payment_id,
          app.payment_signature,
          app.payment_amount,
          app.payment_at,
        ]
      );

      migratedCount++;
    }

    res.json({
      message: `${migratedCount} students migrated successfully to MIS (new entries only).`,
    });
  } catch (err) {
    console.error("❌ Migration error:", err);
    res.status(500).json({ error: "Migration failed" });
  }
};

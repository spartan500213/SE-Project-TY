const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../../db/misDB/pool");

const router = express.Router();

// === Register user (for admin use or testing) ===
router.post("/register", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role)
      return res.status(400).json({ error: "All fields required" });

    const existing = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);
    if (existing.rows.length > 0)
      return res.status(400).json({ error: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);

    // Generate MIS ID automatically based on role
    const prefix =
      role === "student"
        ? "MIS-STU"
        : role === "teacher"
        ? "MIS-TEA"
        : "MIS-ADM";
    const misId = `${prefix}-${Date.now().toString().slice(-4)}`;

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, role, mis_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, role, mis_id`,
      [email, hash, role, misId]
    );

    res.status(201).json({ message: "User registered", user: result.rows[0] });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// === Login route ===
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);

    if (!result.rows.length)
      return res.status(401).json({ error: "Invalid credentialssss" });

    const user = result.rows[0];
    console.log(user);
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) console.log("Password mismatch");
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    console.log("JWT_SECRET inside login:", process.env.JWT_SECRET);

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email, mis_id: user.mis_id },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      message: "Login successful",
      token,
      role: user.role,
      mis_id: user.mis_id,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

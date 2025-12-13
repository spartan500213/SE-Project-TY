const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db/misDB/pool");

exports.loginMISUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (userResult.rows.length === 0)
      return res.status(404).json({ error: "User not found" });

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    // ✅ Create JWT payload with full details
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      mis_id: user.mis_id,
    };

    // ✅ Sign token
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      message: "Login successful",
      token,
      role: user.role,
      mis_id: user.mis_id,
      email: user.email,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

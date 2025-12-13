const db = require("../db/applicationDB/queries");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const registerPost = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;
    console.log(req.body);
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    const existing = await db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: "User already registered" });
    }

    console.log("User registered:", email);
    await db.addUser({ email, password });

    res.status(201).json({
      message: "Registered successfully",
    });
  } catch (err) {
    console.error("Registration error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const loginPost = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await db.getUserByEmail(email);
    if (!user) return res.status(404).json({ error: "User not found" });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
};

module.exports = { registerPost, loginPost };

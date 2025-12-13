// middleware/verifyAdmin.js
const jwt = require("jsonwebtoken");

function verifyAdmin(req, res, next) {
  try {
    if (!req.token) {
      return res.status(403).json({ error: "No token provided" });
    }

    // Decode the token
    const decoded = jwt.verify(req.token, process.env.JWT_SECRET);

    // Attach decoded user to request for later use
    req.user = decoded;

    // Hardcoded admin email check
    if (req.user.email !== "admin@unimis.com") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    next();
  } catch (err) {
    console.error("Admin verification error:", err.message);
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = verifyAdmin;

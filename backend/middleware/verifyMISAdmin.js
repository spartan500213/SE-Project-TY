const verifyMISToken = require("./verifyMISToken");

function verifyMISAdmin(req, res, next) {
  verifyMISToken(req, res, () => {
    console.log("🪪 verifyMISAdmin → decoded user:", req.user);
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  });
}

module.exports = verifyMISAdmin;

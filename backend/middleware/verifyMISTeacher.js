const verifyMISToken = require("./verifyMISToken");

function verifyMISTeacher(req, res, next) {
  verifyMISToken(req, res, () => {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ error: "Teacher access required" });
    }
    next();
  });
}

module.exports = verifyMISTeacher;

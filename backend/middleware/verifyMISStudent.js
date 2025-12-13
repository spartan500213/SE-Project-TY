const verifyMISToken = require("./verifyMISToken");

function verifyMISStudent(req, res, next) {
  verifyMISToken(req, res, () => {
    if (req.user.role !== "student") {
      return res.status(403).json({ error: "Student access required" });
    }
    next();
  });
}

module.exports = verifyMISStudent;

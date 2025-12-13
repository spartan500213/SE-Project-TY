// routes/adminRoutes.js
const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/verifyToken");
const verifyAdmin = require("../middleware/verifyAdmin");
const {
  getAllApplications,
  updateApplicationStatus,
} = require("../controllers/adminControllers");
const {
  migrateConfirmedStudents,
} = require("../controllers/migrationControllers");

// Admin routes
router.get("/admin/applications", verifyToken, verifyAdmin, getAllApplications);
router.put(
  "/admin/applications/:id",
  verifyToken,
  verifyAdmin,
  updateApplicationStatus
);

router.post("/admin/migrate", verifyToken, migrateConfirmedStudents);

module.exports = router;

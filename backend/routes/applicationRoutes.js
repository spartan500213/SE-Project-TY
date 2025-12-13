const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const pool = require("../db/applicationDB/pool");
const verifyToken = require("../middleware/verifyToken");
const { submitApplication } = require("../controllers/applicationController");

const router = express.Router();

// 📁 Base uploads folder
const baseDir = "uploads/applications";
if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir, { recursive: true });
}

// ⚙️ Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.body.user_id;
    if (!userId) return cb(new Error("Missing user_id in form data"));

    const userFolder = path.join(baseDir, userId.toString());
    if (!fs.existsSync(userFolder))
      fs.mkdirSync(userFolder, { recursive: true });

    cb(null, userFolder);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    let fileName;

    if (file.fieldname === "id_document") fileName = "id_document" + ext;
    else if (file.fieldname === "merit_document")
      fileName = "merit_document" + ext;
    else fileName = Date.now() + "-" + file.originalname;

    cb(null, fileName);
  },
});

// ✅ Only allow PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") cb(null, true);
  else cb(new Error("Only PDF files are allowed"), false);
};

const upload = multer({ storage, fileFilter });

/* ==========================================================
   ROUTES
========================================================== */

// 🟢 Check if user already submitted application
router.get("/check/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM applications WHERE user_id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.json({ hasApplied: false });
    }

    res.json({
      hasApplied: true,
      application: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// 🟣 Get fee status for a specific user
router.get("/status/:user_id", verifyToken, async (req, res) => {
  const { user_id } = req.params;

  try {
    const result = await pool.query(
      "SELECT fee_status FROM applications WHERE user_id = $1",
      [user_id]
    );

    if (result.rows.length === 0)
      return res.json({ hasApplied: false, fee_status: null });

    res.json({
      hasApplied: true,
      fee_status: result.rows[0].fee_status,
    });
  } catch (err) {
    console.error("Error fetching application status:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// 🟣 Application submission endpoint
router.post(
  "/apply",
  upload.fields([
    { name: "id_document", maxCount: 1 },
    { name: "merit_document", maxCount: 1 },
  ]),
  submitApplication
);

module.exports = router;

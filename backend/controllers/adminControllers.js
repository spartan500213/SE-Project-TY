// controllers/adminController.js
const pool = require("../db/applicationDB/pool");

// Fetch all applications
const getAllApplications = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM applications ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching applications:", err.message);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
};

// Update admission status
const updateApplicationStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["pending", "confirmed", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  try {
    await pool.query(
      "UPDATE applications SET admission_status = $1 WHERE id = $2",
      [status, id]
    );
    res.json({ message: `Application marked as ${status}` });
  } catch (err) {
    console.error("Error updating status:", err.message);
    res.status(500).json({ error: "Failed to update application status" });
  }
};

module.exports = { getAllApplications, updateApplicationStatus };

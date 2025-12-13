const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const pool = require("../db/applicationDB/pool");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// === Create order ===
router.post("/create-order", verifyToken, async (req, res) => {
  console.log("Create order request body:", req.body);
  try {
    const { amount, user_id } = req.body;
    if (!amount || !user_id) {
      console.log("Missing amount/user_id", req.body);
      return res.status(400).json({ error: "amount and user_id are required" });
    }

    const appResult = await pool.query(
      "SELECT id, fee_status FROM applications WHERE user_id = $1",
      [user_id]
    );
    console.log("Application lookup:", appResult.rows);

    if (appResult.rows.length === 0) {
      return res.status(404).json({ error: "Application not found" });
    }
    if (appResult.rows[0].fee_status === "paid") {
      return res.status(400).json({ error: "Fees already paid" });
    }

    const options = {
      amount: parseInt(amount * 100, 10),
      currency: "INR",
      receipt: "rcpt_" + Date.now(),
    };
    console.log("Creating order with options:", options);

    const order = await razorpay.orders.create(options);
    console.log("Razorpay order created:", order);

    await pool.query(
      "UPDATE applications SET payment_order_id=$1, payment_amount=$2 WHERE user_id=$3",
      [order.id, order.amount, user_id]
    );

    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Create order error details:", err);
    res.status(500).json({ error: err.message || "Failed to create order" });
  }
});

// === Verify payment ===
router.post("/verify", verifyToken, async (req, res) => {
  try {
    const {
      user_id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const hmac = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (hmac !== razorpay_signature)
      return res.status(400).json({ error: "Invalid signature" });

    await pool.query(
      `UPDATE applications 
       SET fee_status='paid', payment_id=$1, payment_signature=$2, payment_at=NOW()
       WHERE user_id=$3`,
      [razorpay_payment_id, razorpay_signature, user_id]
    );

    res.json({ success: true, message: "Payment verified successfully" });
  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({ error: "Verification failed" });
  }
});

module.exports = router;

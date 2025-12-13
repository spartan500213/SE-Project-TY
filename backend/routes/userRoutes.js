//all are protected
//profile
//complete application

//fee payment
////scholarship
////normal payment
const express = require("express");
const { userProfileGet } = require("../controllers/userController");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

router.get("/profile", verifyToken, userProfileGet);

module.exports = router;

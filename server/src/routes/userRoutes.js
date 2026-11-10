const express = require("express");

const { getDashboard } = require("../controllers/userController");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/dashboard", verifyToken, getDashboard);

module.exports = router;
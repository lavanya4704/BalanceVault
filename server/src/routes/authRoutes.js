
const express = require("express");

const {
  registerUser,
  loginUser,
  getCurrentUser,
} = require("../controllers/authController");

const { verifyToken } = require("../middleware/authMiddleware");

const {
  loginLimiter,
  registerLimiter,
} = require("../middleware/rateLimitMiddleware");

const router = express.Router();

router.post("/register", registerLimiter, registerUser);

router.post("/login", loginLimiter, loginUser);

router.get("/me", verifyToken, getCurrentUser);

module.exports = router;

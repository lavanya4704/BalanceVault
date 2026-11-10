const express = require("express");

const {
  registerUser,
  loginUser,
} = require("../controllers/authController");

const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected user profile route
router.get("/me", verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: "You have accessed a protected route.",
    user: req.user,
  });
});

module.exports = router;
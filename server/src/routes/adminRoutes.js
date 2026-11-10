const express = require("express");

const {
  getPendingUsers,
  reviewUser,
} = require("../controllers/adminController");

const {
  verifyToken,
  verifyAdmin,
} = require("../middleware/authMiddleware");

const router = express.Router();

// All routes require administrator authentication
router.use(verifyToken, verifyAdmin);

router.get("/pending-users", getPendingUsers);

router.patch("/users/:userId/review", reviewUser);

module.exports = router;
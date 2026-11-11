
const express = require("express");

const {
  getPendingUsers,
  reviewUser,
  addDemoFunds,
  getAuditLogs,
} = require("../controllers/adminController");

const {
  verifyToken,
  verifyAdmin,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Protect all admin routes
router.use(verifyToken, verifyAdmin);

// Get pending onboarding requests
router.get("/pending-users", getPendingUsers);

// Approve or reject a user
router.patch("/users/:userId/review", reviewUser);

// Add demo funds
router.post("/accounts/:accountNumber/demo-fund", addDemoFunds);

// Get audit logs
router.get("/audit-logs", getAuditLogs);

module.exports = router;

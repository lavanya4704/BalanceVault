const express = require("express");

const {
  getPendingUsers,
  reviewUser,
  addDemoFunds,
  getPendingDepositRequests,
  reviewDepositRequest,
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

// Get pending deposit requests
router.get("/deposit-requests", getPendingDepositRequests);

// Approve or reject a deposit request
router.patch("/deposit-requests/:requestId/review", reviewDepositRequest);

// Add demo funds
router.post("/accounts/:accountNumber/demo-fund", addDemoFunds);

// Get audit logs
router.get("/audit-logs", getAuditLogs);

module.exports = router;

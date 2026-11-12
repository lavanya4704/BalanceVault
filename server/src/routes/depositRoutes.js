const express = require("express");

const {
  createDepositRequest,
  getMyDepositRequests,
} = require("../controllers/depositController");

const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(verifyToken);

router.post("/request", createDepositRequest);
router.get("/my-requests", getMyDepositRequests);

module.exports = router;
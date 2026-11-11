const express = require("express");

const {
  transferMoney,
  getMyTransactions,
} = require("../controllers/transactionController");

const {
  verifyToken,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(verifyToken);

router.post("/transfer", transferMoney);

router.get("/my-transactions", getMyTransactions);

module.exports = router;

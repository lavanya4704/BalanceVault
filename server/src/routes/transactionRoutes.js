const express = require("express");

const {
  transferMoney,
  withdrawMoney,
  getMyTransactions,
} = require("../controllers/transactionController");

const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(verifyToken);

router.post("/transfer", transferMoney);
router.post("/withdraw", withdrawMoney);
router.get("/my-transactions", getMyTransactions);

module.exports = router;

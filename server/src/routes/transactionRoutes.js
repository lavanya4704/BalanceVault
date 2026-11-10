const express = require("express");

const {
  transferMoney,
} = require("../controllers/transactionController");

const {
  verifyToken,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(verifyToken);

router.post("/transfer", transferMoney);

module.exports = router;
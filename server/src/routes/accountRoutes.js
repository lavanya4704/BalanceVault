const express = require("express");

const {
  createAccount,
  getMyAccounts,
  getAccountStatement,
} = require("../controllers/accountController");

const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(verifyToken);

router.post("/", createAccount);
router.get("/my-accounts", getMyAccounts);
router.get("/:accountNumber/statement", getAccountStatement);

module.exports = router;
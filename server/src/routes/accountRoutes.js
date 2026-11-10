const express = require("express");

const {
  createAccount,
  getMyAccounts,
} = require("../controllers/accountController");

const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(verifyToken);

router.post("/", createAccount);
router.get("/my-accounts", getMyAccounts);

module.exports = router;
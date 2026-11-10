const crypto = require("crypto");
const prisma = require("../config/database");

// Generate a unique 12-digit account number
const generateAccountNumber = () => {
  return (
    "BV" +
    crypto.randomInt(1000000000, 9999999999).toString()
  );
};

// Create account for logged-in user
const createAccount = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Check user approval
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Your account must be approved before creating a bank account.",
      });
    }

    // Check if user already has an active account
    const existingAccount = await prisma.account.findFirst({
      where: {
        userId,
        status: "ACTIVE",
      },
    });

    if (existingAccount) {
      return res.status(409).json({
        success: false,
        message: "You already have an active account.",
      });
    }

    const account = await prisma.account.create({
      data: {
        accountNumber: generateAccountNumber(),
        userId,
        balance: 0,
        currency: "INR",
        status: "ACTIVE",
      },
      select: {
        id: true,
        accountNumber: true,
        balance: true,
        currency: true,
        status: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      account,
    });
  } catch (error) {
    console.error("Account creation error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Account number conflict. Please try again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create account.",
    });
  }
};

// Get logged-in user's accounts
const getMyAccounts = async (req, res) => {
  try {
    const accounts = await prisma.account.findMany({
      where: {
        userId: req.user.userId,
      },
      select: {
        id: true,
        accountNumber: true,
        balance: true,
        currency: true,
        status: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      count: accounts.length,
      accounts,
    });
  } catch (error) {
    console.error("Get accounts error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve accounts.",
    });
  }
};

module.exports = {
  createAccount,
  getMyAccounts,
};
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
// Get account statement for a specific account

const getAccountStatement = async (req, res) => {
  try {
    const { accountNumber } = req.params;
    const { fromDate, toDate } = req.query;

    // Verify account ownership
    const account = await prisma.account.findFirst({
      where: {
        accountNumber,
        userId: req.user.userId,
      },
      select: {
        id: true,
        accountNumber: true,
        balance: true,
        currency: true,
        status: true,
      },
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found.",
      });
    }

    // Validate date filters
    const dateFilter = {};

    if (fromDate) {
      const startDate = new Date(fromDate);

      if (Number.isNaN(startDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid fromDate.",
        });
      }

      dateFilter.gte = startDate;
    }

    if (toDate) {
      const endDate = new Date(toDate);

      if (Number.isNaN(endDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid toDate.",
        });
      }

      // Include the entire selected day
      endDate.setUTCHours(23, 59, 59, 999);
      dateFilter.lte = endDate;
    }

    if (
      dateFilter.gte &&
      dateFilter.lte &&
      dateFilter.gte > dateFilter.lte
    ) {
      return res.status(400).json({
        success: false,
        message: "fromDate cannot be after toDate.",
      });
    }

    // Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit) || 10)
    );

    // Build statement filter
    const where = {
      accountId: account.id,
      ...(Object.keys(dateFilter).length > 0
        ? { createdAt: dateFilter }
        : {}),
    };

    // Retrieve statement entries
    const [entries, totalEntries] = await Promise.all([
      prisma.ledgerEntry.findMany({
        where,
        include: {
          transaction: {
            select: {
              reference: true,
              description: true,
              status: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),

      prisma.ledgerEntry.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      account,
      filters: {
        fromDate: fromDate || null,
        toDate: toDate || null,
      },
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalEntries,
        totalPages: Math.ceil(totalEntries / limit),
      },
      count: entries.length,
      statement: entries,
    });
  } catch (error) {
    console.error("Account statement error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve account statement.",
    });
  }
};

module.exports = {
  createAccount,
  getMyAccounts,
  getAccountStatement,
};
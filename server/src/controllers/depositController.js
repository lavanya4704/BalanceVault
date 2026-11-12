const { z } = require("zod");
const prisma = require("../config/database");

// Submit a deposit request (User only)
const createDepositRequest = async (req, res) => {
  try {
    const validation = z.object({
      accountNumber: z.string().trim().min(1, "Account number is required"),
      amount: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount with up to 2 decimal places"),
      remarks: z.string().trim().max(200).optional(),
    }).safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid account number and amount",
        errors: validation.error.issues.map((issue) => issue.message),
      });
    }

    const { accountNumber, amount, remarks } = validation.data;

    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than zero",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, role: true, status: true },
    });

    if (!user || user.role !== "USER" || user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Only active users can submit deposit requests",
      });
    }

    const account = await prisma.account.findFirst({
      where: {
        accountNumber,
        userId: user.id,
        status: "ACTIVE",
      },
      select: {
        id: true,
        accountNumber: true,
        currency: true,
        balance: true,
      },
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Active account not found for this user",
      });
    }

    const request = await prisma.depositRequest.create({
      data: {
        userId: user.id,
        accountId: account.id,
        amount,
        remarks: remarks || null,
      },
      include: {
        account: {
          select: { accountNumber: true, currency: true },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Deposit request submitted successfully. Balance will update after admin approval.",
      request: {
        ...request,
        amount: request.amount.toString(),
      },
    });
  } catch (error) {
    console.error("Create deposit request error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to submit deposit request",
    });
  }
};

// Get deposit requests submitted by the logged-in user
const getMyDepositRequests = async (req, res) => {
  try {
    const requests = await prisma.depositRequest.findMany({
      where: { userId: req.user.userId },
      include: {
        account: {
          select: { accountNumber: true, currency: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests: requests.map((request) => ({
        ...request,
        amount: request.amount.toString(),
      })),
    });
  } catch (error) {
    console.error("My deposit requests error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve deposit requests",
    });
  }
};

module.exports = {
  createDepositRequest,
  getMyDepositRequests,
};

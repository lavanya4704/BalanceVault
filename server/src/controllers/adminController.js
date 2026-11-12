
const { z } = require("zod");
const prisma = require("../config/database");

// Get all pending onboarding requests
const getPendingUsers = async (req, res) => {
  try {
    const requests = await prisma.onboarding.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Pending users error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve pending users",
    });
  }
};

// Approve or reject an onboarding request
const reviewUser = async (req, res) => {
  try {
    const validation = z.object({
      status: z.enum(["APPROVED", "REJECTED"]),
      remarks: z.string().trim().max(500).optional(),
    }).safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Status must be APPROVED or REJECTED",
        errors: validation.error.issues.map(
          (issue) => issue.message
        ),
      });
    }

    const { status, remarks } = validation.data;
    const { userId } = req.params;

    if (userId === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: "Administrators cannot review their own account",
      });
    }

    const onboarding = await prisma.onboarding.findUnique({
      where: { userId },
    });

    if (!onboarding) {
      return res.status(404).json({
        success: false,
        message: "Onboarding request not found",
      });
    }

    if (onboarding.status !== "PENDING") {
      return res.status(409).json({
        success: false,
        message: "This onboarding request has already been reviewed",
      });
    }

    const userStatus =
      status === "APPROVED" ? "ACTIVE" : "SUSPENDED";

    const result = await prisma.$transaction(async (tx) => {
      const updatedOnboarding = await tx.onboarding.update({
        where: { userId },
        data: {
          status,
          remarks: remarks || null,
          reviewedById: req.user.userId,
          reviewedAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          status: userStatus,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: req.user.userId,
          action:
            status === "APPROVED"
              ? "USER_ONBOARDING_APPROVED"
              : "USER_ONBOARDING_REJECTED",
          entity: "Onboarding",
          entityId: onboarding.id,
          metadata: {
            reviewedUserId: userId,
            remarks: remarks || null,
          },
          ipAddress: req.ip,
        },
      });

      return updatedOnboarding;
    });

    return res.status(200).json({
      success: true,
      message: `User onboarding ${status.toLowerCase()} successfully`,
      onboarding: result,
    });
  } catch (error) {
    console.error("Review user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to review onboarding request",
    });
  }
};

// Add demo funds to an account (Admin only)
const addDemoFunds = async (req, res) => {
  try {
    const validation = z.object({
      amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
      remarks: z.string().trim().max(200).optional(),
    }).safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid amount with up to 2 decimal places",
      });
    }

    const { amount, remarks } = validation.data;

    if (Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than zero",
      });
    }

    // Verify current admin status from database
    const admin = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        role: true,
        status: true,
      },
    });

    if (
      !admin ||
      admin.role !== "ADMIN" ||
      admin.status !== "ACTIVE"
    ) {
      return res.status(403).json({
        success: false,
        message: "Only active administrators can add demo funds",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.account.findFirst({
        where: {
          accountNumber: req.params.accountNumber,
          status: "ACTIVE",
        },
      });

      if (!account) {
        const error = new Error("Account not found or inactive");
        error.code = "ACCOUNT_NOT_FOUND";
        throw error;
      }

      const updatedAccount = await tx.account.update({
        where: { id: account.id },
        data: {
          balance: {
            increment: amount,
          },
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: "DEMO_FUNDS_ADDED",
          entity: "Account",
          entityId: account.id,
          metadata: {
            amount,
            currency: account.currency,
            remarks: remarks || null,
          },
          ipAddress: req.ip,
        },
      });

      return updatedAccount;
    });

    return res.status(200).json({
      success: true,
      message: "Demo funds added successfully",
      account: {
        accountNumber: result.accountNumber,
        balance: result.balance.toString(),
        currency: result.currency,
        status: result.status,
      },
    });
  } catch (error) {
    if (error.code === "ACCOUNT_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Add demo funds error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to add demo funds",
    });
  }
};

// Get recent audit logs (Admin only)
const getAuditLogs = async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    return res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    console.error("Audit logs error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve audit logs",
    });
  }
};

module.exports = {
  getPendingUsers,
  reviewUser,
  addDemoFunds,
  getAuditLogs,
};

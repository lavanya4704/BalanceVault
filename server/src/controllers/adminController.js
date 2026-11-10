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
        errors: validation.error.issues.map((issue) => issue.message),
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

    const userStatus = status === "APPROVED" ? "ACTIVE" : "SUSPENDED";

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
          action: status === "APPROVED"
            ? "USER_ONBOARDING_APPROVED"
            : "USER_ONBOARDING_REJECTED",
          entity: "Onboarding",
          entityId: onboarding.id,
          metadata: {
            reviewedUserId: userId,
            remarks: remarks || null,
          },
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

module.exports = {
  getPendingUsers,
  reviewUser,
};
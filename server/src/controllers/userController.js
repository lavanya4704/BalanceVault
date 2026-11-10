const prisma = require("../config/database");

const getDashboard = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        onboarding: {
          select: {
            status: true,
            remarks: true,
            reviewedAt: true,
          },
        },
        accounts: {
          select: {
            id: true,
            accountNumber: true,
            balance: true,
            currency: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const totalBalance = user.accounts.reduce(
      (total, account) => total + Number(account.balance),
      0
    );

    return res.status(200).json({
      success: true,
      message: "Dashboard data retrieved successfully",
      dashboard: {
        profile: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status,
        },
        onboarding: user.onboarding,
        accounts: user.accounts,
        totalBalance,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve dashboard",
    });
  }
};

module.exports = { getDashboard };
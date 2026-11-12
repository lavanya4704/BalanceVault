const { randomUUID } = require("crypto");
const { Prisma } = require("@prisma/client");
const { z } = require("zod");
const prisma = require("../config/database");

// ------------------------------------------
// TRANSFER VALIDATION
// ------------------------------------------

const transferSchema = z.object({
  fromAccountNumber: z.string().trim().min(1),
  toAccountNumber: z.string().trim().min(1),
  amount: z.string().regex(
    /^\d+(\.\d{1,2})?$/,
    "Amount must be positive with up to 2 decimal places"
  ),
  description: z.string().trim().max(200).optional(),
});

// ------------------------------------------
// WITHDRAWAL VALIDATION
// ------------------------------------------

const withdrawalSchema = z.object({
  accountNumber: z.string().trim().min(1),
  amount: z.string().regex(
    /^\d+(\.\d{1,2})?$/,
    "Amount must be positive with up to 2 decimal places"
  ),
  description: z.string().trim().max(200).optional(),
});

// ------------------------------------------
// TRANSFER MONEY
// ------------------------------------------

const transferMoney = async (req, res) => {
  try {
    const validation = transferSchema.safeParse(req.body);

if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid transfer details",
        errors: validation.error.issues.map((issue) => issue.message),
      });
    }

const {
      fromAccountNumber,
      toAccountNumber,
      amount,
      description,
    } = validation.data;

    const transferAmount = new Prisma.Decimal(amount);

if (transferAmount.lte(0)) {
      return res.status(400).json({
        success: false,
        message: "Transfer amount must be greater than zero",
      });
    }

if (fromAccountNumber === toAccountNumber) {
      return res.status(400).json({
        success: false,
        message: "Cannot transfer money to the same account",
      });
    }

// Verify sender ownership
    const sender = await prisma.account.findFirst({
      where: {
        accountNumber: fromAccountNumber,
        userId: req.user.userId,
        status: "ACTIVE",
      },
    });

if (!sender) {
      return res.status(404).json({
        success: false,
        message: "Your active source account was not found",
      });
    }

// Verify recipient account
    const receiver = await prisma.account.findFirst({
      where: {
        accountNumber: toAccountNumber,
        status: "ACTIVE",
      },
    });

if (!receiver) {
      return res.status(404).json({
        success: false,
        message: "Recipient account was not found or is inactive",
      });
    }

if (sender.currency !== receiver.currency) {
      return res.status(400).json({
        success: false,
        message: "Transfers between different currencies are not supported",
      });
    }

// Atomic transfer with double-entry ledger
    const result = await prisma.$transaction(async (tx) => {

// Debit sender only when sufficient balance exists
      const debit = await tx.account.updateMany({
        where: {
          id: sender.id,
          status: "ACTIVE",
          balance: {
            gte: transferAmount,
          },
        },
        data: {
          balance: {
            decrement: transferAmount,
          },
        },
      });

if (debit.count !== 1) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

// Credit recipient only if still active
      const credit = await tx.account.updateMany({
        where: {
          id: receiver.id,
          status: "ACTIVE",
        },
        data: {
          balance: {
            increment: transferAmount,
          },
        },
      });

if (credit.count !== 1) {
        throw new Error("RECEIVER_UNAVAILABLE");
      }

// Create transaction record
const transaction = await tx.transaction.create({
data: {
reference: `BV-${randomUUID()}`,
type: "TRANSFER",
fromAccountId: sender.id,
toAccountId: receiver.id,
amount: transferAmount,
currency: sender.currency,
status: "COMPLETED",
description: description || "BalanceVault transfer",
},
});

// Double-entry ledger
      await tx.ledgerEntry.createMany({
        data: [
          {
            transactionId: transaction.id,
            accountId: sender.id,
            entryType: "DEBIT",
            amount: transferAmount,
          },
          {
            transactionId: transaction.id,
            accountId: receiver.id,
            entryType: "CREDIT",
            amount: transferAmount,
          },
        ],
      });

return transaction;
    });

return res.status(201).json({
      success: true,
      message: "Transfer completed successfully",
      transaction: {
        reference: result.reference,
        amount: result.amount.toString(),
        currency: result.currency,
        status: result.status,
        createdAt: result.createdAt,
      },
    });

} catch (error) {
    if (error.message === "INSUFFICIENT_BALANCE") {
      return res.status(400).json({
        success: false,
        message: "Insufficient account balance",
      });
    }

if (error.message === "RECEIVER_UNAVAILABLE") {
      return res.status(404).json({
        success: false,
        message: "Recipient account is no longer active",
      });
    }

    console.error("Transfer error:", error);

return res.status(500).json({
      success: false,
      message: "Unable to complete transfer",
    });
  }
};

// ------------------------------------------
// WITHDRAW MONEY
// ------------------------------------------

const withdrawMoney = async (req, res) => {
  try {
    const validation = withdrawalSchema.safeParse(req.body);

if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid withdrawal details",
        errors: validation.error.issues.map((issue) => issue.message),
      });
    }

    const { accountNumber, amount, description } = validation.data;

    const withdrawalAmount = new Prisma.Decimal(amount);

if (withdrawalAmount.lte(0)) {
      return res.status(400).json({
        success: false,
        message: "Withdrawal amount must be greater than zero",
      });
    }

// Verify account ownership and active status
    const account = await prisma.account.findFirst({
      where: {
        accountNumber,
        userId: req.user.userId,
        status: "ACTIVE",
      },
    });

if (!account) {
      return res.status(404).json({
        success: false,
        message: "Your active account was not found",
      });
    }

// Atomic withdrawal
    const result = await prisma.$transaction(async (tx) => {

// Deduct only if sufficient balance exists
      const debit = await tx.account.updateMany({
        where: {
          id: account.id,
          userId: req.user.userId,
          status: "ACTIVE",
          balance: {
            gte: withdrawalAmount,
          },
        },
        data: {
          balance: {
            decrement: withdrawalAmount,
          },
        },
      });

if (debit.count !== 1) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

// Create withdrawal transaction
const transaction = await tx.transaction.create({
data: {
reference: `BV-${randomUUID()}`,
type: "WITHDRAWAL",
fromAccountId: account.id,
amount: withdrawalAmount,
currency: account.currency,
status: "COMPLETED",
description: description || "Account withdrawal",
},
});

// Record debit ledger entry
      await tx.ledgerEntry.create({
        data: {
          transactionId: transaction.id,
          accountId: account.id,
          entryType: "DEBIT",
          amount: withdrawalAmount,
        },
      });

// Record audit log
      await tx.auditLog.create({
        data: {
          actorId: req.user.userId,
          action: "WITHDRAWAL_COMPLETED",
          entity: "Account",
          entityId: account.id,
          metadata: {
            amount: withdrawalAmount.toString(),
            currency: account.currency,
            reference: transaction.reference,
          },
          ipAddress: req.ip,
        },
      });

// Get updated account balance
      const updatedAccount = await tx.account.findUnique({
        where: {
          id: account.id,
        },
        select: {
          balance: true,
        },
      });

return {
        transaction,
        balance: updatedAccount.balance,
      };
    });

return res.status(201).json({
      success: true,
      message: "Withdrawal completed successfully",
      transaction: {
        reference: result.transaction.reference,
        type: result.transaction.type,
        amount: result.transaction.amount.toString(),
        currency: result.transaction.currency,
        status: result.transaction.status,
        createdAt: result.transaction.createdAt,
      },
      updatedBalance: result.balance.toString(),
    });

} catch (error) {
    if (error.message === "INSUFFICIENT_BALANCE") {
      return res.status(400).json({
        success: false,
        message: "Insufficient account balance",
      });
    }

    console.error("Withdrawal error:", error);

return res.status(500).json({
      success: false,
      message: "Unable to complete withdrawal",
    });
  }
};

// ------------------------------------------
// GET TRANSACTION HISTORY
// ------------------------------------------

const getMyTransactions = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );

    const { startDate, endDate } = req.query;

const parseDate = (value, fieldName) => {
      if (!value) return null;

if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
throw new Error(`INVALID_${fieldName.toUpperCase()}`);
}

const date = new Date(`${value}T00:00:00.000Z`);

if (
Number.isNaN(date.getTime()) ||
date.toISOString().slice(0, 10) !== value
) {
throw new Error(`INVALID_${fieldName.toUpperCase()}`);
}

return date;
};

const start = parseDate(startDate, "startDate");
const end = parseDate(endDate, "endDate");

if (start && end && start > end) {
return res.status(400).json({
success: false,
message: "End date must not be before start date",
});
}

const accounts = await prisma.account.findMany({
where: {
userId: req.user.userId,
},
select: {
id: true,
},
});

const accountIds = accounts.map((account) => account.id);

const where = {
OR: [
{ fromAccountId: { in: accountIds } },
{ toAccountId: { in: accountIds } },
],
};

if (start || end) {
where.createdAt = {};

if (start) {
where.createdAt.gte = start;
}

if (end) {
const endExclusive = new Date(end);
endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
where.createdAt.lt = endExclusive;
}
}

const [transactions, totalTransactions] = await Promise.all([
prisma.transaction.findMany({
where,
include: {
fromAccount: {
select: {
accountNumber: true,
},
},
toAccount: {
select: {
accountNumber: true,
},
},
ledgerEntries: {
where: {
accountId: {
in: accountIds,
},
},
select: {
entryType: true,
amount: true,
accountId: true,
},
},
},
orderBy: {
createdAt: "desc",
},
skip: (page - 1) * limit,
take: limit,
}),

prisma.transaction.count({ where }),
]);

return res.status(200).json({
success: true,
pagination: {
currentPage: page,
pageSize: limit,
totalTransactions,
totalPages: Math.ceil(totalTransactions / limit),
},
count: transactions.length,
transactions: transactions.map((transaction) => {
  const entries = transaction.ledgerEntries || [];
  const hasDebit = entries.some((entry) => entry.entryType === "DEBIT");
  const hasCredit = entries.some((entry) => entry.entryType === "CREDIT");

  let direction = "â€”";
  if (hasDebit && hasCredit) direction = "INTERNAL";
  else if (hasDebit) direction = "DEBIT";
  else if (hasCredit) direction = "CREDIT";
  else if (transaction.type === "WITHDRAWAL") direction = "DEBIT";
  else if (transaction.type === "DEPOSIT") direction = "CREDIT";

  return { ...transaction, direction };
}),
});

} catch (error) {
if (
error.message === "INVALID_STARTDATE" ||
error.message === "INVALID_ENDDATE"
) {
return res.status(400).json({
success: false,
message: "Dates must be valid YYYY-MM-DD values",
});
}

console.error("Transaction history error:", error);

return res.status(500).json({
success: false,
message: "Unable to retrieve transaction history",
});
}
};

// ------------------------------------------
// EXPORT CONTROLLERS
// ------------------------------------------

module.exports = {
transferMoney,
withdrawMoney,
getMyTransactions,
};
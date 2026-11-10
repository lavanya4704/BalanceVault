const { randomUUID } = require("crypto");
const { Prisma } = require("@prisma/client");
const { z } = require("zod");
const prisma = require("../config/database");

const transferSchema = z.object({
  fromAccountNumber: z.string().trim().min(1),
  toAccountNumber: z.string().trim().min(1),
  amount: z.string().regex(
    /^\d+(\.\d{1,2})?$/,
    "Amount must be positive with up to 2 decimal places"
  ),
  description: z.string().trim().max(200).optional(),
});

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

    const result = await prisma.$transaction(async (tx) => {
      // Atomically debit only if sufficient balance remains.
      const debit = await tx.account.updateMany({
        where: {
          id: sender.id,
          status: "ACTIVE",
          balance: { gte: transferAmount },
        },
        data: {
          balance: { decrement: transferAmount },
        },
      });

      if (debit.count !== 1) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      // Credit the recipient.
      await tx.account.update({
        where: { id: receiver.id },
        data: {
          balance: { increment: transferAmount },
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          reference: `BV-${randomUUID()}`,
          fromAccountId: sender.id,
          toAccountId: receiver.id,
          amount: transferAmount,
          currency: sender.currency,
          status: "COMPLETED",
          description: description || "BalanceVault transfer",
        },
      });

      // Double-entry ledger: debit and credit.
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

    console.error("Transfer error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to complete transfer",
    });
  }
};

module.exports = { transferMoney };
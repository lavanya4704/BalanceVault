const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const accountRoutes = require("./routes/accountRoutes");
const transactionRoutes = require("./routes/transactionRoutes");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/transactions", transactionRoutes);

// Basic API check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "BalanceVault API is running",
  });
});

// Backend health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "BalanceVault Backend",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Database readiness check
app.get("/api/ready", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      database: "connected",
      status: "ready",
    });
  } catch (error) {
    console.error("Database readiness failed:", error.message);

    res.status(503).json({
      success: false,
      database: "disconnected",
      status: "not ready",
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`BalanceVault server running on port ${PORT}`);
});
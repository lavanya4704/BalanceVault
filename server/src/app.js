
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const prisma = require("./config/database");
const { connectRedis } = require("./config/redis");

const app = express();

app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || "http://localhost:5174",
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    credentials: true,
  })
);

app.use(express.json());

// Basic API check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "BalanceVault API is running",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect Redis first
    await connectRedis();

    console.log("Redis initialization completed.");

    // 2. Load rate limiters only after Redis connects
    const {
      apiLimiter,
    } = require("./middleware/rateLimitMiddleware");

    // 3. Apply general API rate limiting
    app.use("/api", apiLimiter);

    // 4. Load routes after Redis connects
    const authRoutes = require("./routes/authRoutes");
    const userRoutes = require("./routes/userRoutes");
    const adminRoutes = require("./routes/adminRoutes");
    const accountRoutes = require("./routes/accountRoutes");
    const transactionRoutes = require("./routes/transactionRoutes");

    // 5. Register API routes
    app.use("/api/auth", authRoutes);
    app.use("/api/users", userRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/deposits", require("./routes/depositRoutes"));
    app.use("/api/accounts", accountRoutes);
    app.use("/api/transactions", transactionRoutes);

    // Health check
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
        console.error(
          "Database readiness failed:",
          error.message
        );

        res.status(503).json({
          success: false,
          database: "disconnected",
          status: "not ready",
        });
      }
    });

    // 6. Start Express
    app.listen(PORT, () => {
      console.log(`BalanceVault server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();

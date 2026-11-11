
const { createClient } = require("redis");

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (error) => {
  console.error("Redis Client Error:", error.message);
});

redisClient.on("ready", () => {
  console.log("Redis connected successfully.");
});

const connectRedis = async () => {
  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL is missing from environment variables.");
  }

  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};

module.exports = {
  redisClient,
  connectRedis,
};

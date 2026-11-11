
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");

const { redisClient } = require("../config/redis");

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,

  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: "balancevault:api:",
  }),

  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

// Login rate limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,

  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: "balancevault:login:",
  }),

  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
});

// Registration rate limiter
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,

  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: "balancevault:register:",
  }),

  message: {
    success: false,
    message: "Too many registration attempts. Please try again later.",
  },
});

module.exports = {
  apiLimiter,
  loginLimiter,
  registerLimiter,
};

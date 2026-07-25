const fs = require("fs");
const winston = require("winston");

const isProd = process.env.NODE_ENV === "production";

// logs/ is gitignored and never committed, so on a fresh production
// deploy it won't exist yet — winston's File transport doesn't reliably
// create nested directories itself, which throws ENOENT on first boot.
if (isProd && !fs.existsSync("logs")) {
  fs.mkdirSync("logs", { recursive: true });
}

const logger = winston.createLogger({
  level: isProd ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    isProd
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(
            ({ timestamp, level, message, stack }) =>
              `[${timestamp}] ${level}: ${stack || message}`
          )
        )
  ),
  transports: [
    new winston.transports.Console(),
    ...(isProd
      ? [
          new winston.transports.File({ filename: "logs/error.log", level: "error" }),
          new winston.transports.File({ filename: "logs/combined.log" }),
        ]
      : []),
  ],
  exitOnError: false,
});

module.exports = logger;
const path = require("path");
// Load environment variables from project root .env
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const http = require("http");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const apiRoutes = require("./routes");
const { initSocket } = require("./config/socket");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Security HTTP headers
app.use(helmet());

// CORS configuration
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
app.use(
  cors({
    origin: [clientUrl, "http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting (general security)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: "Too many requests from this IP, please try again later." },
});
app.use("/api", generalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: "Too many authentication attempts. Please try again after 15 minutes." },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date(), uptime: process.uptime() });
});

// Register API Routes
app.use("/api", apiRoutes);

// Fallback 404 error handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: `Endpoint ${req.method} ${req.originalUrl} not found` });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err);

  const statusCode = err.statusCode || 500;
  let message = err.message || "An unexpected server error occurred.";

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ success: false, message: "File is too large. Maximum size allowed is 5MB." });
  }

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    message = Object.values(err.errors).map((e) => e.message).join(", ");
    return res.status(400).json({ success: false, message });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `A record with this ${field} already exists.`;
    return res.status(400).json({ success: false, message });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === "CastError") {
    message = "Invalid ID format.";
    return res.status(400).json({ success: false, message });
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// Initialize Socket.io
initSocket(server);

// Start listening
server.listen(PORT, () => {
  console.log(`SocietyCare server running on port ${PORT}`);
  console.log(`Client origin allowed: ${clientUrl}`);
});

module.exports = app;

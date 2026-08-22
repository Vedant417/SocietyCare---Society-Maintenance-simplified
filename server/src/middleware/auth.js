const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwttokenchangeinproduction";

/**
 * Protect routes: Authenticates JWT token
 */
async function protect(req, res, next) {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No authentication token provided.",
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);

      const user = await User.findById(decoded.id).select(
        "id name email phone apartmentNumber role gender dateOfBirth profilePhotoUrl weatherLatitude weatherLongitude weatherLocationName createdAt"
      );

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "The user belonging to this token no longer exists.",
        });
      }

      // Attach plain object with id as string
      req.user = user.toJSON();
      next();
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Your session has expired. Please log in again.",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please authenticate again.",
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Authorize roles: Ensures the user has the ADMIN role
 */
function restrictToAdmin(req, res, next) {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Forbidden. You do not have permission to access this resource.",
    });
  }
  next();
}

module.exports = { protect, restrictToAdmin };

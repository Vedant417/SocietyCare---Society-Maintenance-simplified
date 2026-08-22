const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwttokenchangeinproduction";
const JWT_EXPIRES_IN = "7d";

function signToken(id, role) {
  return jwt.sign({ id, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function safeUser(user) {
  const obj = user.toJSON ? user.toJSON() : user;
  return {
    id: obj.id || obj._id?.toString(),
    name: obj.name,
    email: obj.email,
    phone: obj.phone,
    apartmentNumber: obj.apartmentNumber,
    role: obj.role,
    gender: obj.gender,
    dateOfBirth: obj.dateOfBirth,
    profilePhotoUrl: obj.profilePhotoUrl,
    weatherLatitude: obj.weatherLatitude,
    weatherLongitude: obj.weatherLongitude,
    weatherLocationName: obj.weatherLocationName,
    createdAt: obj.createdAt,
  };
}

/**
 * Register a new resident user
 */
async function register(req, res, next) {
  try {
    const { name, email, phone, apartmentNumber, password, gender, dateOfBirth } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "A user with this email address already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      apartmentNumber,
      passwordHash,
      gender: gender || null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      role: "RESIDENT",
    });

    const token = signToken(user._id, user.role);

    return res.status(201).json({
      success: true,
      message: "Account created successfully!",
      data: { token, user: safeUser(user) },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Login user
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const token = signToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: "Logged in successfully!",
      data: { token, user: safeUser(user) },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current user profile
 */
async function getMe(req, res, next) {
  try {
    return res.status(200).json({ success: true, data: { user: req.user } });
  } catch (error) {
    next(error);
  }
}

/**
 * Update user profile details & avatar
 */
async function updateProfile(req, res, next) {
  try {
    const {
      name,
      email,
      phone,
      gender,
      dateOfBirth,
      profilePhotoUrl,
    } = req.body;

    const userId = req.user.id;

    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and phone number are required.",
      });
    }

    // Check whether email is already used by another account
    if (email.toLowerCase() !== req.user.email.toLowerCase()) {
      const existingUser = await User.findOne({
        email: email.toLowerCase(),
      });

      if (
        existingUser &&
        existingUser._id.toString() !== userId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This email address is already in use by another account.",
        });
      }
    }

    const updateData = {
      name,
      email: email.toLowerCase(),
      phone,
      gender: gender || null,
      dateOfBirth: dateOfBirth
        ? new Date(dateOfBirth)
        : (req.user.dateOfBirth || null),
    };

    // If user uploads a custom photo, store in GridFS and save the API endpoint as profilePhotoUrl
    if (req.file) {
      const { uploadToGridFS } = require("../services/gridfsService");
      const fileId = await uploadToGridFS(
        req.file.buffer,
        req.file.originalname || "avatar",
        req.file.mimetype
      );
      // Store the API endpoint URL so it's persisted across sessions
      updateData.profilePhotoUrl = `/api/auth/avatar/${userId}?fileId=${fileId.toString()}`;
    }

    // If user selects a preloaded illustrated avatar, store its path directly
    if (profilePhotoUrl && !req.file) {
      updateData.profilePhotoUrl = profilePhotoUrl;
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully!",
      data: {
        user: safeUser(updated),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Logout user
 */
async function logout(req, res, next) {
  try {
    return res.status(200).json({ success: true, message: "Logged out successfully." });
  } catch (error) {
    next(error);
  }
}

/**
 * Serve user avatar directly from GridFS
 * GET /auth/avatar/:userId?fileId=<gridfsFileId>
 */
async function getUserAvatar(req, res, next) {
  try {
    const { fileId } = req.query;

    if (!fileId) {
      return res.status(400).json({ success: false, message: "fileId query parameter is required." });
    }

    const { downloadFromGridFS } = require("../services/gridfsService");
    const fileData = await downloadFromGridFS(fileId);

    if (!fileData) {
      return res.status(404).json({ success: false, message: "Avatar file not found in database." });
    }

    res.setHeader("Content-Type", fileData.contentType);
    fileData.stream.pipe(res);
  } catch (error) {
    next(error);
  }
}

/**
 * Save user weather location preference
 */
async function updateWeatherLocation(req, res, next) {
  try {
    const { latitude, longitude, locationName } = req.body;
    const userId = req.user.id;

    if (latitude === undefined || longitude === undefined || !locationName) {
      return res.status(400).json({ success: false, message: "Latitude, longitude, and location name are required." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        weatherLatitude: latitude,
        weatherLongitude: longitude,
        weatherLocationName: locationName,
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Weather location updated successfully!",
      data: {
        user: safeUser(updatedUser),
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login, getMe, updateProfile, logout, getUserAvatar, updateWeatherLocation };

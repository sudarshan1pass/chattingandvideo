const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const isBlank = (value) =>
  value === undefined ||
  value === null ||
  String(value).trim() === "";

const logSignupPayload = (req, name, email, password) => {
  if (process.env.DEBUG_AUTH !== "true") {
    return;
  }

  console.log("SIGNUP req.body:", req.body);
  console.log("SIGNUP name:", name);
  console.log("SIGNUP email:", email);
  console.log("SIGNUP password:", password);
};

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing");
  }

  return process.env.JWT_SECRET;
};

const sendAppError = (res, error, action) => {
  console.error(`${action} failed:`, {
    name: error.name,
    code: error.code,
    message: error.message,
  });

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "User already exists",
    });
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid user id",
    });
  }

  if (error.message === "JWT_SECRET is missing") {
    return res.status(500).json({
      success: false,
      message: "JWT_SECRET is not configured",
    });
  }

  return res.status(500).json({
    success: false,
    message: `${action} failed`,
    error: error.message,
  });
};

const toSafeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
});

// ================= SIGNUP =================

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    logSignupPayload(req, name, email, password);

    if (
      isBlank(name) ||
      isBlank(email) ||
      isBlank(password)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "name, email, and password are required",
      });
    }

    const normalizedName = String(name).trim();
    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();
    const plainPassword = String(password);

    const existingUser = await User.findOne({
      email: normalizedEmail,
    }).select("_id");

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(
      plainPassword,
      10
    );

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
    });

    return res.status(201).json({
      success: true,
      message: "Signup Successful",
      userId: user._id.toString(),
    });
  } catch (error) {
    return sendAppError(res, error, "Signup");
  }
};

// ================= LOGIN =================

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (isBlank(email) || isBlank(password)) {
      return res.status(400).json({
        success: false,
        message: "email and password are required",
      });
    }

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(
      String(password),
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid Password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
      },
      getJwtSecret(),
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login Successful",
      token,
      user: toSafeUser(user),
    });
  } catch (error) {
    return sendAppError(res, error, "Login");
  }
};

const getUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const users = await User.find({
      _id: { $ne: currentUserId },
    })
      .select("name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users: users.map(toSafeUser),
    });
  } catch (error) {
    return sendAppError(res, error, "Get users");
  }
};

module.exports = {
  signup,
  login,
  getUsers,
};

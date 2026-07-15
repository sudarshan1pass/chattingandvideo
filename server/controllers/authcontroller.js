const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require("../Config/db.js");

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

const sendDatabaseError = (res, error, action) => {
  console.error(`${action} failed:`, {
    code: error.code,
    message: error.message,
    sqlMessage: error.sqlMessage,
  });

  if (error.code === "ER_DUP_ENTRY") {
    return res.status(409).json({
      success: false,
      message: "User already exists",
    });
  }

  if (
    error.code === "ER_NO_SUCH_TABLE" ||
    error.code === "ER_BAD_FIELD_ERROR"
  ) {
    return res.status(500).json({
      success: false,
      message:
        "Database schema mismatch. Expected users table columns: id, name, email, password.",
      error: error.sqlMessage || error.message,
    });
  }

  if (
    error.code === "ENOTFOUND" ||
    error.code === "ECONNREFUSED" ||
    error.code === "ETIMEDOUT" ||
    error.code === "ER_ACCESS_DENIED_ERROR"
  ) {
    return res.status(500).json({
      success: false,
      message:
        "Database connection failed. Check the Railway MySQL environment variables.",
      error: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: `${action} failed`,
    error: error.sqlMessage || error.message,
  });
};


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

    const [users] = await db.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail]
    );

    if (users.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword =
      await bcrypt.hash(plainPassword, 10);

    const [insertResult] = await db.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [
        normalizedName,
        normalizedEmail,
        hashedPassword,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Signup Successful",
      userId: insertResult.insertId,
    });

  } catch (error) {
    return sendDatabaseError(
      res,
      error,
      "Signup"
    );
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

    const [users] = await db.query(
      "SELECT id, name, email, password FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = users[0];

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
        id: user.id,
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
      user,
    });

  } catch (error) {

    return sendDatabaseError(
      res,
      error,
      "Login"
    );
  }
};

const getUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const [users] = await db.query(
      "SELECT id,name,email FROM users WHERE id != ?",
      [currentUserId]
    );

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    return sendDatabaseError(
      res,
      error,
      "Get users"
    );
  }
};

module.exports = {
  signup,
  login,
  getUsers,
};


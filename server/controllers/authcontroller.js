const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const  db  = require("../Config/db.js");


// ================= SIGNUP =================

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const [result] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (result.length > 0) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword]
    );

    return res.status(201).json({
      success: true,
      message: "Signup Successful",
    });

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};



// ================= LOGIN =================

const login = async (req, res) => {
  try {

    const { email, password } = req.body;

    const [result] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = result[0];

    const isMatch = await bcrypt.compare(
      password,
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
      "secretkey",
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

    console.log(error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
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
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  signup,
  login,getUsers
};


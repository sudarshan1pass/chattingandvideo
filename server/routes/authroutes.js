const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  getUsers,
} = require("../controllers/authcontroller");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/signup", signup);

router.post("/login", login);

router.get(
  "/users",
  authMiddleware,
  getUsers
);

module.exports = router;
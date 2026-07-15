const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
   console.log(req.headers);
  try {

    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No Token",
      });
    }

    const decoded = jwt.verify(token, "secretkey");

    req.user = decoded;

    next();

  } catch (error) {

    return res.status(401).json({
      success: false,
      message: "Invalid Token",
    });
  }
};

module.exports = authMiddleware;
// auth.js
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    // ✅ Declare decodedToken (not 'decoded' to avoid naming issues)
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET || "secret");

if (!decodedToken || !decodedToken.userId) {
      return res.status(401).json({ message: "Invalid token payload." });
    }

    req.user = {
      _id: decodedToken.userId,
      email: decodedToken.email,
    };

    next();
  } catch (err) {
    console.error("❌ Auth Middleware Error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

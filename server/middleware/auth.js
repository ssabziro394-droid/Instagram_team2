const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  // Support testing with header if needed
  const testUserId = req.headers["x-test-user-id"];
  if (testUserId) {
    req.user = { id: testUserId };
    return next();
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided, authorization denied" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Decode the token without verification (as the secret is managed by the C# API)
    const decoded = jwt.decode(token);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    // Extract user ID from various possible JWT claim fields
    const userId =
      decoded.sid ??
      decoded.id ??
      decoded.userId ??
      decoded.sub ??
      decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ??
      decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/sid"];

    if (!userId) {
      return res.status(401).json({ message: "User ID not found in token" });
    }

    req.user = { id: String(userId) };
    next();
  } catch (error) {
    console.error("JWT decoding error:", error);
    return res.status(401).json({ message: "Token decoding failed" });
  }
};

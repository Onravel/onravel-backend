import jwt from "jsonwebtoken";
import User from "../models/User.js";

const isUserMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const accessToken = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      accessToken,
      process.env.JWT_ACCESS_TOKEN_SECRET
    );

    const user = await User.findById(decoded.userId).select("-password");

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User account is unavailable.",
      });
    }

    req.user = user;

    next();
  }  catch (error) {
  if (error.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      code: "ACCESS_TOKEN_EXPIRED",
      message: "Access token has expired.",
    });
  }

  if (error.name === "JsonWebTokenError" || error.name === "NotBeforeError") {
    return res.status(401).json({
      success: false,
      code: "INVALID_ACCESS_TOKEN",
      message: "Invalid access token.",
    });
  }

  console.error("Authentication middleware error:", error);

  return res.status(500).json({
    success: false,
    message: "Unable to authenticate user.",
  });
}
};

export default isUserMiddleware;

import jwt from "jsonwebtoken";
import crypto from "crypto";
import RefreshToken from "../models/RefreshToken.js";

const logOut = async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Refresh token not provided.",
    });
  }

  try {
    // Verify the refresh JWT.
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_TOKEN_SECRET
    );

    // Hash the supplied token to locate its device session.
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const session = await RefreshToken.findOne({
      tokenHash,
      user: decoded.userId,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });

    // Clear the cookie regardless of whether the session exists.
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Refresh session is invalid or already revoked.",
      });
    }

    // Revoke only this device's session.
    session.revokedAt = new Date();
    await session.save();

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token.",
      });
    }

    console.error("Logout error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to log out.",
    });
  }
};

export default logOut;

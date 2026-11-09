
import jwt from "jsonwebtoken";
import crypto from "crypto";
import RefreshToken from "../models/RefreshToken.js";

const refreshToken = async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Refresh token not provided.",
    });
  }

  // Verify the refresh JWT.
  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_TOKEN_SECRET);
  } catch (error) {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token.",
    });
  }

  try {
    // Hash the supplied token to find its registered device session.
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const session = await RefreshToken.findOne({
      tokenHash,
      user: decoded.userId,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    }).populate("user");

    if (!session || !session.user || !session.user.isActive) {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });

      return res.status(401).json({
        success: false,
        message: "Refresh session is invalid or revoked.",
      });
    }

    // Issue a new access token without creating another refresh session.
    const accessToken = jwt.sign(
      {
        userId: session.user._id,
        role: session.user.role,
      },
      process.env.JWT_ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    return res.status(200).json({
      success: true,
      accessToken,
    });
  } catch (error) {
    console.error("Token refresh error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to refresh authentication.",
    });
  }
};

export default refreshToken;

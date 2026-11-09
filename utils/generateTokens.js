import jwt from "jsonwebtoken";
import crypto from "crypto";
import RefreshToken from "../models/RefreshToken.js";

// Generate both tokens and register the refresh token as a device session.
const generateTokens = async (user) => {
  // Access token: short-lived token used to access protected API routes.
  const accessToken = jwt.sign(
    {
      userId: user._id,
      role: user.role,
    },
    process.env.JWT_ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

  // Refresh token: longer-lived token used to obtain a new access token.
  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  // Hash the refresh token before storing it.
  // SHA-256 is suitable here because JWTs have high entropy.
  const tokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  // Calculate the refresh token's expiry date.
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Save this refresh token as an independent device session.
  await RefreshToken.create({
    user: user._id,
    tokenHash,
    expiresAt,
  });

  // Return the original tokens so the controller can send them to the client.
  return { accessToken, refreshToken };
};

export default generateTokens;
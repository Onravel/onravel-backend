
import generateTokens from "../utils/generateTokens.js";
import sendHttpOnlyCookie from "../utils/sendHttpOnlyCookie.js";
import Analytics from "../models/admin/Analytics.js";

const authUser = async (req, res) => {
  try {
    const user = req.user;

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed.",
      });
    }

    const isNewUser = req.authInfo?.isNewUser ?? false;

    // Update analytics when a new storefront account is created.
    if (isNewUser) {
      await Analytics.updateOne(
        { _id: "onravel_analytics" },
        {
          $inc: {
            "user.total": 1,
          },
        },
        { upsert: true },
      );
    }

    // Generate access and refresh tokens.
    const { accessToken, refreshToken } = await generateTokens(user);

    // Store refresh token in an HttpOnly cookie.
    sendHttpOnlyCookie(res, refreshToken);

    // Google OAuth browser redirect.
    if (req.path === "/auth/google/callback") {
      const isAdmin = ["admin", "super_admin"].includes(user.role);

      if (isAdmin) {
        return res.redirect("http://localhost:5173/admin");
      }

      return res.redirect("http://localhost:3000/auth/callback");
    }

    // Standard JSON authentication response.
    return res.status(isNewUser ? 201 : 200).json({
      success: true,
      message: isNewUser
        ? "Account created successfully."
        : "Signed in successfully.",
      accessToken,
    });
  } catch (error) {
    console.error("Authentication error:", error);

    if (req.path === "/auth/google/callback") {
      return res.redirect(
        "http://localhost:3000/auth?error=authentication_failed",
      );
    }

    return res.status(500).json({
      success: false,
      message: "Authentication failed.",
    });
  }
};

export default authUser;

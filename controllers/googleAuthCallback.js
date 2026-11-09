
import generateTokens from "../utils/generateTokens.js";

const googleAuthCallback = async (req, res) => {
  try {
    const user = req.user;
    const isNewUser = req.authInfo?.isNewUser ?? false;

    const { accessToken, refreshToken } = await generateTokens(user);

    // Keep the refresh token inaccessible to frontend JavaScript.
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    // The browser navigates to the Next.js callback page.
    return res.redirect(
      `http://localhost:3000/auth/callback`
    );
  } catch (error) {
    console.error("Google authentication error:", error);

    return res.redirect(
      "http://localhost:3000/sign-in?error=authentication_failed"
    );
  }
};

export default googleAuthCallback;

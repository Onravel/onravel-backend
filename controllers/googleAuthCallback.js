
import generateTokens from "../utils/generateTokens.js";
import sendHttpOnlyCookie from "../utils/sendHttpOnlyCookie.js";

const googleAuthCallback = async (req, res) => {
  try {
    const user = req.user;
    const {  refreshToken } = await generateTokens(user);

    // Keep the refresh token inaccessible to frontend JavaScript.
    sendHttpOnlyCookie(res, "refreshToken", refreshToken)

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

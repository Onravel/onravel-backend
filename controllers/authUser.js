import generateTokens from "../utils/generateTokens.js";
import sendHttpOnlyCookie from "../utils/sendHttpOnlyCookie.js";

// Handle successful Google authentication.
const authUser = async (req, res) => {
  try {
    // Passport attaches the authenticated user to req.user.
    const user = req.user;

    // Determine whether Passport just created this account.
    const isNewUser = req.authInfo?.isNewUser ?? false;

    // Generate access and refresh tokens.
    // The refresh token's hash is also saved in MongoDB.
    const { accessToken, refreshToken } = await generateTokens(user);

    sendHttpOnlyCookie(res,  refreshToken);

    // accessToken is used to  call /me endpoint to get user details. 
    return res.status(isNewUser ? 201 : 200).json({
      success: true,
      isNewUser,
      message: isNewUser
        ? "Account created successfully."
        : "Signed in successfully.",
      accessToken,
    });

  } catch (error) {
    console.error("Authentication error:", error);

    return res.status(500).json({
      success: false,
      message: "Authentication failed.",
    });
  }
};

export default authUser;
import express from "express";
import passport from "passport";
import authUser from "../controllers/authUser.js";
import googleAuthCallback from "../controllers/googleAuthCallback.js";
import refreshToken from "../controllers/refreshToken.js";
import isUserMiddleware from "../middlewares/isUserMiddleware.js";
import authEmail from "../controllers/authEmail.js";
import verifyOtp from "../controllers/verifyOtp.js";
import resendOtp from "../controllers/resendOtp.js";
import logOut from "../controllers/logOut.js";

const userRoutes = express.Router();

// Existing authentication route.
userRoutes.get("/auth", authUser);

// Start Google authentication.
userRoutes.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

// Google redirects here after authentication.
// Passport verifies the Google profile and attaches the user to req.user.
// authUser then generates tokens and returns the authentication response.
userRoutes.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/api/user/auth/failed",
  }),
  googleAuthCallback
);

// Authentication failure.
userRoutes.get("/auth/failed", (req, res) => {
  res.status(401).json({
    success: false,
    message: "Google authentication failed",
  });
});

userRoutes.post("/refresh", refreshToken);
userRoutes.post("/auth/email", authEmail);
userRoutes.post("/auth/verify-otp", verifyOtp);
userRoutes.post("/auth/resend-otp", resendOtp);
userRoutes.post("/logout", logOut);

userRoutes.get("/me", isUserMiddleware, (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
});

export default userRoutes;
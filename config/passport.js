
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import User from "../models/User.js";
import AuthAccount from "../models/AuthAccount.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/api/user/auth/google/callback",
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        // 1. Extract the user's information from their Google profile.
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value?.toLowerCase();
        const fullName = profile.displayName;
        const profileImage = profile.photos?.[0]?.value;

        // Google tells us whether the email belongs to the user.
        const emailVerified = profile._json.email_verified;

        // 2. Make sure Google has supplied a verified email.
        if (!email || !emailVerified) {
          return done(null, false, {
            message: "A verified Google email is required.",
          });
        }

        // 3. Check whether this Google account has signed in before.
        const existingAccount = await AuthAccount.findOne({
          provider: "google",
          providerAccountId: googleId,
        }).populate("user");

        // 4. If the Google account exists, retrieve its Onravel user.
        if (existingAccount) {
          const user = existingAccount.user;

          // Prevent disabled accounts from signing in.
          if (!user || !user.isActive) {
            return done(null, false, {
              message: "This account is unavailable.",
            });
          }

          // Record the latest successful login.
          user.lastLoginAt = new Date();
          await user.save();

          // Passport makes this user available as req.user.
          return done(null, user, { isNewUser: false });
        }

        // 5. Check whether another Onravel account already uses this email.
        const existingUser = await User.findOne({ email });

        // Do not automatically connect a new Google identity to an
        // existing account just because the email addresses match.
        if (existingUser) {
          return done(null, false, {
            message: "An account with this email already exists. Sign in using your existing method.",
          });
        }

        // 6. Create a new Onravel user.
        const newUser = await User.create({
          fullName,
          email,
          emailVerified: new Date(),
          profileImage: profileImage || null,
          role: "user",
          lastLoginAt: new Date(),
        });

        // 7. Connect the Google account to the newly created user.
        await AuthAccount.create({
          user: newUser._id,
          provider: "google",
          providerAccountId: googleId,
        });

        // 8. Authentication succeeded. Return the new user.
        return done(null, newUser, { isNewUser: true });

      } catch (error) {
        // Pass unexpected errors to Passport.
        return done(error, null);
      }
    }
  )
);

export default passport;

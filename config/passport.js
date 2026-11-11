
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
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value?.trim().toLowerCase();
        const fullName = profile.displayName;
        const profileImage = profile.photos?.[0]?.value;
        const emailVerified = profile._json.email_verified;

        if (!email || !emailVerified) {
          return done(null, false, {
            message: "A verified Google email is required.",
          });
        }

        // 1. Check whether this Google account is already linked.
        const existingAccount = await AuthAccount.findOne({
          provider: "google",
          providerAccountId: googleId,
        }).populate("user");

        if (existingAccount) {
          const user = existingAccount.user;

          if (!user || !user.isActive) {
            return done(null, false, {
              message: "This account is unavailable.",
            });
          }

          user.lastLoginAt = new Date();
          await user.save();

          return done(null, user, { isNewUser: false });
        }

        // 2. Check whether an Onravel user already exists with this email.
        let user = await User.findOne({ email });

        let isNewUser = false;

        if (user) {
          // 3. Reuse the existing account.
          if (!user.isActive) {
            return done(null, false, {
              message: "This account is unavailable.",
            });
          }

          // Do not overwrite the existing user's profile information.
        } else {
          // 4. Create a new Onravel user if none exists.
          user = await User.create({
            fullName,
            email,
            emailVerified: new Date(),
            profileImage: profileImage || null,
            role: "user",
          });

          isNewUser = true;
        }

        // 5. Link this Google identity to the Onravel user.
        await AuthAccount.create({
          user: user._id,
          provider: "google",
          providerAccountId: googleId,
        });

        // 6. Record successful login.
        user.lastLoginAt = new Date();
        await user.save();

        return done(null, user, { isNewUser });

      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export default passport;

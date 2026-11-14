import crypto from "crypto";
import validator from "validator";
import AuthAccount from "../models/AuthAccount.js";
import Otp from "../models/Otp.js";
import User from "../models/User.js";
import generateTokens from "../utils/generateTokens.js";
import sendHttpOnlyCookie from "../utils/sendHttpOnlyCookie.js";
import Analytics from "../models/admin/Analytics.js";

const MAX_OTP_ATTEMPTS = 5;

export default async function verifyOtp(req, res) {
  try {
    let { email, otp } = req.body ?? {};

    if (typeof email !== "string" || !validator.isEmail(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address.",
      });
    }

    email = email.trim().toLowerCase();

    if (typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Verification code must be six digits.",
      });
    }

    const otpRecord = await Otp.findOne({ email });

    if (!otpRecord || otpRecord.verified) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code.",
      });
    }

    if (otpRecord.expiresAt <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Request a new one.",
      });
    }

    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message: "Too many verification attempts. Request a new code.",
      });
    }

    const submittedHash = crypto.createHash("sha256").update(otp).digest();
    const storedHash = Buffer.from(otpRecord.otpHash, "hex");
    const isValidOtp =
      storedHash.length === submittedHash.length &&
      crypto.timingSafeEqual(storedHash, submittedHash);

    if (!isValidOtp) {
      const updatedOtp = await Otp.findOneAndUpdate(
        {
          _id: otpRecord._id,
          otpHash: otpRecord.otpHash,
          verified: false,
          expiresAt: { $gt: new Date() },
          attempts: { $lt: MAX_OTP_ATTEMPTS },
        },
        { $inc: { attempts: 1 } },
        { returnDocument: "after" },
      );

      const currentOtp = updatedOtp || (await Otp.findById(otpRecord._id));
      if (!updatedOtp && currentOtp?.attempts >= MAX_OTP_ATTEMPTS) {
        return res.status(429).json({
          success: false,
          message: "Too many verification attempts. Request a new code.",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code.",
      });
    }

    const claimedOtp = await Otp.findOneAndUpdate(
      {
        _id: otpRecord._id,
        otpHash: otpRecord.otpHash,
        verified: false,
        expiresAt: { $gt: new Date() },
        attempts: { $lt: MAX_OTP_ATTEMPTS },
      },
      { $set: { verified: true } },
      { returnDocument: "after" },
    );

    if (!claimedOtp) {
      const currentOtp = await Otp.findById(otpRecord._id);
      if (currentOtp?.attempts >= MAX_OTP_ATTEMPTS) {
        return res.status(429).json({
          success: false,
          message: "Too many verification attempts. Request a new code.",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code.",
      });
    }

    let user = await User.findOne({ email });
    const isNewUser = !user;

    if (!user) {
      user = await User.create({
        email,
        emailVerified: new Date(),
      });

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

    if (!user.isActive) {
      await Otp.deleteOne({ _id: claimedOtp._id });
      return res.status(403).json({
        success: false,
        message: "This account is unavailable.",
      });
    }

    const emailAccount = await AuthAccount.findOne({
      user: user._id,
      provider: "email",
    });

    if (!emailAccount) {
      try {
        await AuthAccount.create({
          user: user._id,
          provider: "email",
          providerAccountId: email,
        });
      } catch (error) {
        if (error?.code !== 11000) {
          throw error;
        }

        const conflictingAccount = await AuthAccount.findOne({
          provider: "email",
          providerAccountId: email,
        });

        if (
          !conflictingAccount ||
          String(conflictingAccount.user) !== String(user._id)
        ) {
          await Otp.deleteOne({ _id: claimedOtp._id });
          return res.status(409).json({
            success: false,
            message: "Unable to authenticate this account.",
          });
        }
      }
    }

    user.lastLoginAt = new Date();
    await user.save();
    await Otp.deleteOne({ _id: claimedOtp._id });

    const { accessToken, refreshToken } = await generateTokens(user);

    sendHttpOnlyCookie(res, refreshToken);

    return res.status(200).json({
      success: true,
      isNewUser: false,
      message: "Signed in successfully.",
      accessToken,
    });
  } catch (error) {
    console.error("Email OTP authentication error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication failed.",
    });
  }
}

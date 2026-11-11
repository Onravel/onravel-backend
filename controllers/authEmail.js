
import User from "../models/User.js";
import validator from "validator";
import Otp from "../models/Otp.js";
import sendOTP from "../utils/sendOtp.js";
import generateOtp from "../utils/generateOtp.js";
import crypto from "crypto";

const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

export default async function authEmail(req, res) {
  try {
    let { email } = req.body ?? {};

    if (typeof email !== "string" || !validator.isEmail(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address.",
      });
    }

    email = email.trim().toLowerCase();

    const previousOtp = await Otp.findOne({ email });
    if (previousOtp) {
      const lastSentAt = previousOtp.lastSentAt || previousOtp.createdAt;
      const availableAt = lastSentAt.getTime() + OTP_RESEND_COOLDOWN_MS;
      const remainingMs = availableAt - Date.now();

      if (remainingMs > 0) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${Math.ceil(
            remainingMs / 1000
          )} seconds before requesting another code.`,
        });
      }
    }

    const existingUser = await User.findOne({ email });
    const purpose = existingUser ? "sign in" : "sign up";

    const otp = generateOtp();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

    const storedOtp = await Otp.findOneAndUpdate(
      { email },
      {
        otpHash,
        expiresAt,
        lastSentAt: now,
        attempts: 0,
        verified: false,
      },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
      }
    );

    try {
      await sendOTP(email, otp, purpose);
    } catch (error) {
      await Otp.deleteOne({ _id: storedOtp._id, otpHash });
      throw error;
    }

    return res.status(200).json({
      success: true,
      message: "Verification code sent to your email.",
      data: {
        requiresVerification: true,
      },
    });
  } catch (error) {
    console.error("Error in authEmail controller:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to send verification code. Please try again.",
    });
  }
}

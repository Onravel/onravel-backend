import crypto from "crypto";
import validator from "validator";
import Otp from "../models/Otp.js";
import User from "../models/User.js";
import generateOtp from "../utils/generateOtp.js";
import sendOTP from "../utils/sendOtp.js";

const RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_EXPIRY_MS = 10 * 60 * 1000;

export default async function resendOtp(req, res) {
  try {
    let { email } = req.body ?? {};

    if (typeof email !== "string" || !validator.isEmail(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address.",
      });
    }

    email = email.trim().toLowerCase();

    const existingOtp = await Otp.findOne({ email });

    if (!existingOtp) {
      return res.status(404).json({
        success: false,
        message: "Request a verification code before asking to resend it.",
      });
    }

    if (existingOtp.verified) {
      return res.status(400).json({
        success: false,
        message: "This verification code has already been used.",
      });
    }

    const now = new Date();
    const lastSentAt = existingOtp.lastSentAt || existingOtp.createdAt;
    const availableAt = new Date(lastSentAt.getTime() + RESEND_COOLDOWN_MS);
    const cooldownCutoff = new Date(now.getTime() - RESEND_COOLDOWN_MS);

    if (availableAt > now) {
      return res.status(429).json({
        success: false,
        message: `Please wait ${Math.ceil(
          (availableAt.getTime() - now.getTime()) / 1000
        )} seconds before requesting another code.`,
      });
    }

    const user = await User.findOne({ email });
    const purpose = user ? "sign in" : "sign up";
    const otp = generateOtp();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MS);

    const updatedOtp = await Otp.findOneAndUpdate(
      {
        _id: existingOtp._id,
        verified: false,
        $or: [
          { lastSentAt: { $lte: cooldownCutoff } },
          {
            lastSentAt: { $exists: false },
            createdAt: { $lte: cooldownCutoff },
          },
          { lastSentAt: null, createdAt: { $lte: cooldownCutoff } },
        ],
      },
      {
        $set: {
          otpHash,
          expiresAt,
          lastSentAt: now,
          attempts: 0,
          verified: false,
        },
      },
      { new: true }
    );

    if (!updatedOtp) {
      const currentOtp = await Otp.findById(existingOtp._id);

      if (!currentOtp) {
        return res.status(404).json({
          success: false,
          message: "Request a verification code before asking to resend it.",
        });
      }

      if (currentOtp.verified) {
        return res.status(400).json({
          success: false,
          message: "This verification code has already been used.",
        });
      }

      const currentLastSentAt = currentOtp.lastSentAt || currentOtp.createdAt;
      const currentAvailableAt = new Date(
        currentLastSentAt.getTime() + RESEND_COOLDOWN_MS
      );

      return res.status(429).json({
        success: false,
        message: `Please wait ${Math.max(
          1,
          Math.ceil((currentAvailableAt.getTime() - Date.now()) / 1000)
        )} seconds before requesting another code.`,
      });
    }

    try {
      await sendOTP(email, otp, purpose);
    } catch (error) {
      await Otp.deleteOne({ _id: updatedOtp._id, otpHash });
      throw error;
    }

    return res.status(200).json({
      success: true,
      message: "A new verification code has been sent to your email.",
      data: {
        requiresVerification: true,
      },
    });
  } catch (error) {
    console.error("Error resending email OTP:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to resend verification code. Please try again.",
    });
  }
}

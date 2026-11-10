import sendMail from "./email/sendMail.js";
import sendOtpMail from "./email/sendOtpMail.js";

export default function sendOTP(to, otp, purpose = "verify your email") {
  return sendMail(
    to,
    "Your Onravel Verification Code",
    sendOtpMail(otp, purpose)
  );
}
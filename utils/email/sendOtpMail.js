
export default function sendOtpMail(otp, purpose = "sign in") {
  const isSignUp = purpose === "sign up";

  const message = isSignUp
    ? "Use this code to complete your Onravel account registration."
    : "Use this code to securely sign in to your Onravel account.";

  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 30px; color: #141414;">

      <h2>Onravel Fashion</h2>

      <p>Your verification code is:</p>

      <h1 style="font-size: 36px; letter-spacing: 8px; margin: 20px 0;">
        ${otp}
      </h1>

      <p>${message}</p>

      <p>This code expires in 10 minutes.</p>

      <p>If you didn't request this code, you can safely ignore this email.</p>

    </div>
  `;
}

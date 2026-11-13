
import { parsePhoneNumberFromString } from "libphonenumber-js";

const discoverySources = [
  "instagram",
  "tiktok",
  "facebook",
  "google",
  "website",
  "friend",
  "family",
  "other",
];

const allowedSex = ["male", "female", "prefer_not_to_say"];

const updateOnboarding = async (req, res) => {
  console.log("hit");
  try {
    const user = req.user;
    const body = req.body;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request body.",
      });
    }

    const fields = Object.keys(body);

    // STEP 2: Discovery information
    if (fields.includes("heardAboutUs")) {
      if (fields.length !== 1) {
        return res.status(400).json({
          success: false,
          message: "Invalid onboarding fields.",
        });
      }

      const { heardAboutUs } = body;

      if (
        typeof heardAboutUs !== "string" ||
        !discoverySources.includes(heardAboutUs)
      ) {
        return res.status(400).json({
          success: false,
          message: "Please select a valid discovery source.",
        });
      }

      const profileComplete =
        Boolean(user.fullName?.trim()) &&
        Boolean(user.phone) &&
        allowedSex.includes(user.sex);

      if (!profileComplete) {
        return res.status(400).json({
          success: false,
          message: "Please complete your personal information first.",
        });
      }

      user.onboarding.heardAboutUs = heardAboutUs;
      user.onboarding.completed = true;
      user.onboarding.completedAt = new Date();

      await user.save();

      return res.status(200).json({
        success: true,
        message: "Onboarding completed successfully.",
        user,
      });
    }

    // STEP 1: Personal information
    const expectedFields = ["fullName", "phone", "sex"];

    if (
      fields.length !== expectedFields.length ||
      !expectedFields.every((field) => fields.includes(field))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid personal information fields.",
      });
    }

    const { fullName, phone, sex } = body;

    if (typeof fullName !== "string" || !fullName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide your full name.",
      });
    }

    if (typeof phone !== "string" || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide your phone number.",
      });
    }

    if (!allowedSex.includes(sex)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid option for sex.",
      });
    }

    const phoneNumber = parsePhoneNumberFromString(phone.trim());

    if (!phoneNumber || !phoneNumber.isValid()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid international phone number.",
      });
    }

    user.fullName = fullName.trim();
    user.phone = phoneNumber.number;
    user.sex = sex;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Personal information updated successfully.",
      user,
    });
  } catch (error) {
    console.error("Update onboarding error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid information provided.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating your onboarding.",
    });
  }
};

export default updateOnboarding;

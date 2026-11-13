import Analytics from "../models/admin/analytics/Analytics.js";

const updateUserGenderAnalytics = async (user) => {
  try {
    if (!user || !user.onboarding.completed) return;

    if (!["male", "female"].includes(user.sex)) return;

    await Analytics.updateOne(
      { _id: "onravel_analytics" },
      {
        $inc: {
          [`user.gender.${user.sex}`]: 1,
        },
      },
      { upsert: true },
    );
  } catch (error) {
    console.error("User gender analytics error:", error);
    throw error;
  }
};

export default updateUserGenderAnalytics;
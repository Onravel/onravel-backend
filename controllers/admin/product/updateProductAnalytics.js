
import Analytics from "../../models/admin/Analytics.js";

const ANALYTICS_ID = "onravel_analytics";

const updateProductAnalytics = async ({
  action,
  categoryId,
  previousCategoryId,
}) => {
  const updates = {};

  if (action === "create") {
    const currentMonth = new Date().toISOString().slice(0, 7);

    updates.$inc = {
      "product.total": 1,
      [`product.monthlyCreated.${currentMonth}`]: 1,
      [`product.categoryCounts.${categoryId}`]: 1,
    };
  }

  if (action === "edit") {
    // No category change: nothing to update.
    if (String(previousCategoryId) === String(categoryId)) {
      return;
    }

    updates.$inc = {
      [`product.categoryCounts.${previousCategoryId}`]: -1,
      [`product.categoryCounts.${categoryId}`]: 1,
    };
  }

  if (action === "delete") {
    updates.$inc = {
      "product.total": -1,
      [`product.categoryCounts.${categoryId}`]: -1,
    };
  }

  if (!updates.$inc) {
    throw new Error("Invalid product analytics action.");
  }

  return Analytics.updateOne(
    { _id: ANALYTICS_ID },
    updates,
    { upsert: true },
  );
};

export default updateProductAnalytics;

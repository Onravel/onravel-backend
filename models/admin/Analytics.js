import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: "onravel_analytics",
    },

    user: {
      total: {
        type: Number,
        default: 0,
      },

      gender: {
        male: {
          type: Number,
          default: 0,
        },

        female: {
          type: Number,
          default: 0,
        },
      },
    },

    product: {},

    order: {},

    transaction: {},
  },
  { timestamps: true }
);

const Analytics =
  mongoose.models.Analytics ||
  mongoose.model("Analytics", analyticsSchema);

export default Analytics;
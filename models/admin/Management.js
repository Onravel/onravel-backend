
import mongoose from "mongoose";

const measurementSchema = new mongoose.Schema(
  {
    male: {
      type: [String],
      default: [],
    },

    female: {
      type: [String],
      default: [],
    },
  },
  { _id: false },
);

const categorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    video: {
      type: String,
      default: null,
    },

    measurements: {
      type: measurementSchema,
      default: () => ({}),
    },
  },
  { timestamps: true },
);

const managementSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: "onravel_management",
    },

    categories: {
      type: [categorySchema],
      default: [],
    },

    attributes: {
      type: [String],
      default: [],
    },

    occasions: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

const Management =
  mongoose.models.Management ||
  mongoose.model("Management", managementSchema);

export default Management;

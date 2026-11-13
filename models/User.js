import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    emailVerified: {
      type: Date,
      default: null,
    },

    phone: {
      type: String,
      trim: true,
      default: null,
    },

    phoneVerified: {
      type: Date,
      default: null,
    },

    sex: {
      type: String,
      enum: ["male", "female", "prefer_not_to_say"],
      default: null,
    },

    profileImage: {
      type: String,
      default: null,
    },

    role: {
      type: String,
      enum: ["user", "admin", "super_admin"],
      default: "user",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    onboarding: {
  heardAboutUs: {
    type: String,
    enum: [
      "instagram",
      "tiktok",
      "facebook",
      "google",
      "website",
      "friend",
      "family",
      "other",
    ],
    default: "",
  },

  completed: {
    type: Boolean,
    default: false,
  },

  completedAt: {
    type: Date,
    default: null,
  },
},

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;

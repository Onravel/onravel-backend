import mongoose from "mongoose";

const authAccountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    provider: {
      type: String,
      enum: ["google", "email"],
      required: true,
    },

    providerAccountId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

authAccountSchema.index(
  { provider: 1, providerAccountId: 1 },
  { unique: true }
);

const AuthAccount =
  mongoose.models.AuthAccount ||
  mongoose.model("AuthAccount", authAccountSchema);

export default AuthAccount;
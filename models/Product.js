import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    category: {
 type: mongoose.Schema.Types.ObjectId,
  required: true,
    },

    attributes: {
      type: [String],
      default: [],
    },

    occasions: {
      type: [String],
      default: [],
    },

    media: {
      images: {
        type: [
          {
            url: {
              type: String,
              required: true,
            },
            publicId: {
              type: String,
              required: true,
            },
          },
        ],
        default: [],
      },

      video: {
        url: {
          type: String,
          default: null,
        },
        publicId: {
          type: String,
          default: null,
        },
      },
    },
  },
  { timestamps: true }
);

const Product =
  mongoose.models.Product ||
  mongoose.model("Product", productSchema);

export default Product;
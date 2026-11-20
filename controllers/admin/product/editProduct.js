import mongoose from "mongoose";
import Product from "../../../models/Product.js";
import Management from "../../../models/admin/Management.js";

const MANAGEMENT_ID = "onravel_management";

const parseArray = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return [];
  }

  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      const error = new Error(`${fieldName} must be valid JSON.`);
      error.statusCode = 400;
      throw error;
    }
  }

  if (
    !Array.isArray(value) ||
    !value.every((item) => typeof item === "string" && item.trim())
  ) {
    const error = new Error(`${fieldName} must contain valid strings.`);
    error.statusCode = 400;
    throw error;
  }

  const seen = new Set();

  return value
    .map((item) => item.trim())
    .filter((item) => {
      const key = item.toLowerCase();

      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    });
};

const validateOptions = (selected, available, fieldName) => {
  const options = new Map(
    available.map((item) => [item.trim().toLowerCase(), item])
  );

  const invalid = selected.filter(
    (item) => !options.has(item.toLowerCase())
  );

  if (invalid.length) {
    const error = new Error(
      `Invalid ${fieldName}: ${invalid.join(", ")}.`
    );
    error.statusCode = 400;
    throw error;
  }

  return selected.map((item) => options.get(item.toLowerCase()));
};

const editProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "A valid product ID is required.",
      });
    }

    const existingProduct = await Product.findById(productId).lean();

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const { name, description, price, category } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product name is required.",
      });
    }

    if (
      price === undefined ||
      price === null ||
      String(price).trim() === "" ||
      !Number.isFinite(Number(price)) ||
      Number(price) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid product price is required.",
      });
    }

    if (!mongoose.isValidObjectId(category)) {
      return res.status(400).json({
        success: false,
        message: "A valid product category is required.",
      });
    }

    const attributes = parseArray(req.body.attributes, "Attributes");
    const occasions = parseArray(req.body.occasions, "Occasions");

    const management = await Management.findById(MANAGEMENT_ID)
      .select("categories attributes occasions");

    if (!management) {
      return res.status(400).json({
        success: false,
        message: "Product management settings were not found.",
      });
    }

    const selectedCategory = management.categories.id(category);

    if (!selectedCategory) {
      return res.status(400).json({
        success: false,
        message: "Invalid product category.",
      });
    }

    const validAttributes = validateOptions(
      attributes,
      management.attributes || [],
      "attributes"
    );

    const validOccasions = validateOptions(
      occasions,
      management.occasions || [],
      "occasions"
    );

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        $set: {
          name: name.trim(),
          description:
            typeof description === "string" ? description.trim() : "",
          price: Number(price),
          category: selectedCategory._id,
          attributes: validAttributes,
          occasions: validOccasions,
        },
      },
      { new: true, runValidators: true }
    ).lean();

    const images = Array.isArray(updatedProduct.media?.images)
      ? updatedProduct.media.images
      : [];

    const video = updatedProduct.media?.video
      ? {
          url: updatedProduct.media.video.url ?? null,
          publicId: updatedProduct.media.video.publicId ?? null,
        }
      : {
          url: null,
          publicId: null,
        };

    return res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      product: {
        _id: updatedProduct._id,
        name: updatedProduct.name,
        slug: updatedProduct.slug,
        description: updatedProduct.description,
        price: updatedProduct.price,
        category: {
          _id: selectedCategory._id,
          title: selectedCategory.title,
          slug: selectedCategory.slug,
        },
        attributes: updatedProduct.attributes || [],
        occasions: updatedProduct.occasions || [],
        media: {
          images,
          video,
        },
        createdAt: updatedProduct.createdAt,
        updatedAt: updatedProduct.updatedAt,
      },
    });
  } catch (error) {
    console.error("Edit product error:", error);

    if (error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating the product.",
    });
  }
};

export default editProduct;

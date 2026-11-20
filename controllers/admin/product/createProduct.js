
import mongoose from "mongoose";
import Product from "../../../models/Product.js";
import Management from "../../../models/admin/Management.js";
import { cloudinary } from "../../../config/cloudinary.js";

const MANAGEMENT_ID = "onravel_management";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

const createSlug = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

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

const cleanupUploads = async (files = {}) => {
  const uploads = [
    ...(files.images || []).map((file) => ({
      publicId: file.filename,
      resourceType: "image",
    })),
    ...(files.video || []).map((file) => ({
      publicId: file.filename,
      resourceType: "video",
    })),
  ];

  await Promise.allSettled(
    uploads
      .filter((file) => file.publicId)
      .map(({ publicId, resourceType }) =>
        cloudinary.uploader.destroy(publicId, {
          resource_type: resourceType,
        })
      )
  );
};

const createProduct = async (req, res) => {
  let productCreated = false;

  try {
    const { name, description, price, category } = req.body;

    const images = req.files?.images || [];
    const video = req.files?.video?.[0] || null;

    // 1. Validate required fields.
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

    // 2. At least one image is required.
    if (images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one product image is required.",
      });
    }

    // 3. Validate file sizes.
    for (const image of images) {
      if (image.size > MAX_IMAGE_SIZE) {
        return res.status(400).json({
          success: false,
          message: "Each product image must not exceed 10 MB.",
        });
      }

      if (!image.path || !image.filename) {
        throw new Error("Product image upload metadata is missing.");
      }
    }

    if (video) {
      if (video.size > MAX_VIDEO_SIZE) {
        return res.status(400).json({
          success: false,
          message: "Product video must not exceed 100 MB.",
        });
      }

      if (!video.path || !video.filename) {
        throw new Error("Product video upload metadata is missing.");
      }
    }

    // 4. Parse selected attributes and occasions.
    const attributes = parseArray(req.body.attributes, "Attributes");
    const occasions = parseArray(req.body.occasions, "Occasions");

    // 5. Retrieve Management options.
    const management = await Management.findById(MANAGEMENT_ID)
      .select("categories attributes occasions");

    if (!management) {
      return res.status(400).json({
        success: false,
        message: "Product management settings were not found.",
      });
    }

    // 6. Validate selected category.
    const selectedCategory = management.categories.id(category);

    if (!selectedCategory) {
      return res.status(400).json({
        success: false,
        message: "Invalid product category.",
      });
    }

    // 7. Validate attributes and occasions.
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

    // 8. Generate a unique slug.
    const baseSlug = createSlug(name);

    if (!baseSlug) {
      return res.status(400).json({
        success: false,
        message: "Product name must contain letters or numbers.",
      });
    }

    let slug = baseSlug;
    let suffix = 2;

    while (await Product.exists({ slug })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    // 9. Prepare product media.
    const media = {
      images: images.map((image) => ({
        url: image.path,
        publicId: image.filename,
      })),

      video: video
        ? {
            url: video.path,
            publicId: video.filename,
          }
        : {
            url: null,
            publicId: null,
          },
    };

    // 10. Create product.
    const product = await Product.create({
      name: name.trim(),
      slug,
      description:
        typeof description === "string" ? description.trim() : "",
      price: Number(price),
      category: selectedCategory._id,
      attributes: validAttributes,
      occasions: validOccasions,
      media,
    });

    productCreated = true;

    return res.status(201).json({
      success: true,
      message: "Product created successfully.",
      product,
    });
  } catch (error) {
    console.error("Create product error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A product with this slug already exists.",
      });
    }

    if (error.statusCode === 400 || error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating the product.",
    });
  } finally {
    // Clean up Cloudinary uploads if product creation failed.
    if (!productCreated) {
      await cleanupUploads(req.files);
    }
  }
};

export default createProduct;

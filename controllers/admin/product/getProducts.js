import Product from "../../../models/Product.js";
import Management from "../../../models/admin/Management.js";

const MANAGEMENT_ID = "onravel_management";

const getProducts = async (req, res) => {
  try {
    const products = await Product.find().lean();

    if (products.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Products retrieved successfully.",
        products: [],
      });
    }

    const management = await Management.findById(MANAGEMENT_ID)
      .select("categories")
      .lean();

    const categories = new Map(
      (management?.categories || []).map((category) => [
        String(category._id),
        {
          _id: category._id,
          title: category.title,
          slug: category.slug,
        },
      ])
    );

    const resolvedProducts = products.map((product) => {
      const category = categories.get(String(product.category)) || null;

      const images = Array.isArray(product.media?.images)
        ? product.media.images
        : [];

      const video = product.media?.video
        ? {
            url: product.media.video.url ?? null,
            publicId: product.media.video.publicId ?? null,
          }
        : {
            url: null,
            publicId: null,
          };

      return {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        category,
        attributes: product.attributes || [],
        occasions: product.occasions || [],
        media: {
          images,
          video,
        },
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Products retrieved successfully.",
      products: resolvedProducts,
    });
  } catch (error) {
    console.error("Get products error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while retrieving products.",
    });
  }
};

export default getProducts;

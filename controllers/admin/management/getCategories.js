import Management from "../../../models/admin/Management.js";

const MANAGEMENT_ID = "onravel_management";

const getCategories = async (req, res) => {
  try {
    const management = await Management.findById(MANAGEMENT_ID)
      .select("categories")
      .lean();

    return res.status(200).json({
      success: true,
      categories: management?.categories || [],
    });
  } catch (error) {
    console.error("Get categories error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while retrieving categories.",
    });
  }
};

export default getCategories;
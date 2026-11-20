import Management from "../../../models/admin/Management.js";

const MANAGEMENT_ID = "onravel_management";

const getOccasions = async (req, res) => {
  try {
    const management = await Management.findById(MANAGEMENT_ID)
      .select("occasions")
      .lean();

    return res.status(200).json({
      success: true,
      occasions: management?.occasions || [],
    });
  } catch (error) {
    console.error("Get occasions error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while retrieving occasions.",
    });
  }
};

export default getOccasions;

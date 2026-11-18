import Management from "../../../models/admin/Management.js";

const MANAGEMENT_ID = "onravel_management";

const getAttributes = async (req, res) => {
  try {
    const management = await Management.findById(MANAGEMENT_ID)
      .select("attributes")
      .lean();

    return res.status(200).json({
      success: true,
      attributes: management?.attributes || [],
    });
  } catch (error) {
    console.error("Get attributes error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while retrieving attributes.",
    });
  }
};

export default getAttributes;

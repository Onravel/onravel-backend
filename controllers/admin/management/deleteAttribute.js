import Management from "../../../models/admin/Management.js";

const MANAGEMENT_ID = "onravel_management";

const deleteAttribute = async (req, res) => {
  try {
    const { attribute } = req.body || {};

    if (typeof attribute !== "string" || !attribute.trim()) {
      return res.status(400).json({
        success: false,
        message: "Attribute is required.",
      });
    }

    const trimmedAttribute = attribute.trim();
    const management = await Management.findById(MANAGEMENT_ID);
    const attributeIndex = management?.attributes?.findIndex(
      (existingAttribute) =>
        typeof existingAttribute === "string" &&
        existingAttribute.trim().toLowerCase() === trimmedAttribute.toLowerCase()
    );

    if (attributeIndex === undefined || attributeIndex < 0) {
      return res.status(404).json({
        success: false,
        message: "Attribute not found.",
      });
    }

    const [deletedAttribute] = management.attributes.splice(attributeIndex, 1);
    await management.save();

    return res.status(200).json({
      success: true,
      message: "Attribute deleted successfully.",
      attribute: deletedAttribute,
    });
  } catch (error) {
    console.error("Delete attribute error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting the attribute.",
    });
  }
};

export default deleteAttribute;

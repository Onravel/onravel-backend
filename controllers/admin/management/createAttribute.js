import Management from "../../../models/admin/Management.js";

const MANAGEMENT_ID = "onravel_management";

const createAttribute = async (req, res) => {
  try {
    const { attribute } = req.body || {};

    if (typeof attribute !== "string" || !attribute.trim()) {
      return res.status(400).json({
        success: false,
        message: "Attribute is required.",
      });
    }

    const trimmedAttribute = attribute.trim();

    if (/\s/.test(trimmedAttribute)) {
      return res.status(400).json({
        success: false,
        message: "Attribute must be a single word.",
      });
    }

    let management = await Management.findById(MANAGEMENT_ID);

    if (!management) {
      management = await Management.create({
        _id: MANAGEMENT_ID,
        attributes: [],
      });
    }

    if (!Array.isArray(management.attributes)) {
      management.attributes = [];
    }

    const attributeExists = management.attributes.some(
      (existingAttribute) =>
        existingAttribute.trim().toLowerCase() ===
        trimmedAttribute.toLowerCase()
    );

    if (attributeExists) {
      return res.status(409).json({
        success: false,
        message: "This attribute already exists.",
      });
    }

    management.attributes.push(trimmedAttribute);
    await management.save();

    return res.status(201).json({
      success: true,
      message: "Attribute created successfully.",
      attribute: trimmedAttribute,
    });
  } catch (error) {
    console.error("Create attribute error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating the attribute.",
    });
  }
};

export default createAttribute;

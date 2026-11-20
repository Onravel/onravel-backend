import Management from "../../../models/admin/Management.js";

const MANAGEMENT_ID = "onravel_management";

const createOccasion = async (req, res) => {
  try {
    const { occasion } = req.body || {};

    if (typeof occasion !== "string" || !occasion.trim()) {
      return res.status(400).json({
        success: false,
        message: "Occasion is required.",
      });
    }

    const trimmedOccasion = occasion.trim();

    if (/\s/.test(trimmedOccasion)) {
      return res.status(400).json({
        success: false,
        message: "Occasion must be a single word.",
      });
    }

    let management = await Management.findById(MANAGEMENT_ID);

    if (!management) {
      management = await Management.create({
        _id: MANAGEMENT_ID,
        occasions: [],
      });
    }

    if (!Array.isArray(management.occasions)) {
      management.occasions = [];
    }

    const occasionExists = management.occasions.some(
      (existingOccasion) =>
        existingOccasion.trim().toLowerCase() ===
        trimmedOccasion.toLowerCase()
    );

    if (occasionExists) {
      return res.status(409).json({
        success: false,
        message: "This occasion already exists.",
      });
    }

    management.occasions.push(trimmedOccasion);
    await management.save();

    return res.status(201).json({
      success: true,
      message: "Occasion created successfully.",
      occasion: trimmedOccasion,
    });
  } catch (error) {
    console.error("Create occasion error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating the occasion.",
    });
  }
};

export default createOccasion;

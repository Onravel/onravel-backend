import Management from "../../../models/admin/Management.js";

const MANAGEMENT_ID = "onravel_management";

const deleteOccasion = async (req, res) => {
  try {
    const { occasion } = req.body || {};

    if (typeof occasion !== "string" || !occasion.trim()) {
      return res.status(400).json({
        success: false,
        message: "Occasion is required.",
      });
    }

    const trimmedOccasion = occasion.trim();
    const management = await Management.findById(MANAGEMENT_ID);
    const occasionIndex = management?.occasions?.findIndex(
      (existingOccasion) =>
        typeof existingOccasion === "string" &&
        existingOccasion.trim().toLowerCase() === trimmedOccasion.toLowerCase()
    );

    if (occasionIndex === undefined || occasionIndex < 0) {
      return res.status(404).json({
        success: false,
        message: "Occasion not found.",
      });
    }

    const [deletedOccasion] = management.occasions.splice(occasionIndex, 1);
    await management.save();

    return res.status(200).json({
      success: true,
      message: "Occasion deleted successfully.",
      occasion: deletedOccasion,
    });
  } catch (error) {
    console.error("Delete occasion error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting the occasion.",
    });
  }
};

export default deleteOccasion;

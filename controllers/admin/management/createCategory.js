import Management from "../../../models/admin/Management.js";

const MANAGEMENT_ID = "onravel_management";
const ALLOWED_GENDERS = ["male", "female"];

const createSlug = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const isValidMeasurements = (m) => {
  if (m === undefined) return true;
  if (typeof m !== "object" || m === null || Array.isArray(m)) return false;

  if (Object.keys(m).some((k) => !ALLOWED_GENDERS.includes(k))) return false;

  return ALLOWED_GENDERS.every(
    (k) =>
      m[k] === undefined ||
      (Array.isArray(m[k]) &&
        m[k].every((f) => typeof f === "string" && f.trim().length > 0))
  );
};

// Trim, drop empties and remove duplicates (case-insensitive)
const cleanFields = (fields = []) => {
  const seen = new Set();
  return fields
    .map((f) => f.trim())
    .filter((f) => {
      const key = f.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const createCategory = async (req, res) => {
  try {
    let { title, description, measurements } = req.body;

    // 1. Validate required fields
    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof description !== "string" ||
      !description.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Category title and description are required.",
      });
    }

    // 2. multipart/form-data sends nested data as a string, so parse it
    if (typeof measurements === "string") {
      try {
        measurements = JSON.parse(measurements);
      } catch {
        return res.status(400).json({
          success: false,
          message: "Measurements must be valid JSON.",
        });
      }
    }

    // 3. Validate measurements
    if (!isValidMeasurements(measurements)) {
      return res.status(400).json({
        success: false,
        message: "Invalid measurement fields.",
      });
    }

    // 4. Build slug and make sure it's usable
    const slug = createSlug(title);

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Category title must contain letters or numbers.",
      });
    }

    // 5. Get or create the management document
    let management = await Management.findById(MANAGEMENT_ID);

    if (!management) {
      management = await Management.create({
        _id: MANAGEMENT_ID,
        categories: [],
      });
    }

    // 6. Make sure the categories array exists (older docs may lack it)
    if (!Array.isArray(management.categories)) {
      management.categories = [];
    }

    // 7. Check for an existing category (by slug or by title)
    const categoryExists = management.categories.some(
      (category) =>
        category.slug === slug ||
        category.title?.trim().toLowerCase() === title.trim().toLowerCase()
    );

    if (categoryExists) {
      return res.status(409).json({
        success: false,
        message: "This category already exists.",
      });
    }

    // 8. Create the category
    management.categories.push({
      title: title.trim(),
      slug,
      description: description.trim(),
      video: req.file?.path || null,
      measurements: {
        male: cleanFields(measurements?.male),
        female: cleanFields(measurements?.female),
      },
    });

    await management.save();

    const category = management.categories.at(-1);

    return res.status(201).json({
      success: true,
      message: "Category created successfully.",
      category,
    });
  } catch (error) {
    console.error("Create category error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating the category.",
    });
  }
};

export default createCategory;
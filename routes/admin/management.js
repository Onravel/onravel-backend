import express from "express";
import multer from "multer";

import { storage } from "../../config/cloudinary.js";
import isUserMiddleware from "../../middlewares/isUserMiddleware.js"
import isAdminMiddleware from "../../middlewares/isAdminMiddleware.js";

import createCategory from "../../controllers/admin/management/createCategory.js";

const managementRoutes = express.Router();

const upload = multer({ storage });

managementRoutes.use(isUserMiddleware, isAdminMiddleware);

managementRoutes.post(
  "/categories",
  upload.single("video"),
  createCategory
);

export default managementRoutes;
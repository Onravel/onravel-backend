import express from "express"
import multer from "multer";

import { storage } from "../../config/cloudinary.js";
import createProduct from "../../controllers/admin/product/createProduct.js";
import getProducts from "../../controllers/admin/product/getProducts.js";
import isAdminMiddleware from '../../middlewares/isAdminMiddleware.js'
import isUserMiddleware from "../../middlewares/isUserMiddleware.js";

const productRoutes = express.Router();
const upload = multer({ storage });

productRoutes.get(
  "/",
  isUserMiddleware,
  isAdminMiddleware,
  getProducts
);

productRoutes.post(
  "/",
  isUserMiddleware,
  isAdminMiddleware,
    upload.fields([
    { name: "images", maxCount: 10 },
    { name: "video", maxCount: 1 },
  ]),
  createProduct
);

export default productRoutes;
import express from "express"
import authMiddleware from "../middleware/auth.middleware.js"
import checkRole from "../middleware/checkRole.middlware.js"

import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct
} from "../controllers/product.controller.js"
const router = express.Router()

router
  .route("/product")
  .post(authMiddleware, checkRole(["admin"]), createProduct);

router
  .route("/product/:productId")
  .get(authMiddleware, checkRole(["admin"]), getProductById)
  .put(authMiddleware, checkRole(["admin"]), updateProduct)
  .delete(authMiddleware, checkRole(["admin"]), deleteProduct);

export default router

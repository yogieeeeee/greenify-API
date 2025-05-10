import express from "express"

// Middleware
import authMiddleware from "../middleware/auth.middleware.js"
import checkRole from "../middleware/checkRole.middlware.js"
import attachId from "../middleware/attachUserID.middleware.js"

// Controller
import {getAllProducts} from "../controllers/product.controller.js"
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart
} from "../controllers/cart.controller.js"
import {createOrder} from "../controllers/order.controller.js"
//import {createOrder} from "../controllers/order.model.js"

const router = express.Router()

// Product
router.get("/product", getAllProducts)

// Cart system
router
  .route("/cart")
  .get(authMiddleware, checkRole("buyer"), getCart)
  .post(authMiddleware, attachId("userId"), checkRole("buyer"), addToCart)

router
  .route("/cart/:itemId")
  .put(authMiddleware, checkRole("buyer"), updateCartItem)
  .delete(authMiddleware, checkRole("buyer"), removeFromCart)
// Order system.
router
  .route("/order")
  .post(authMiddleware, attachId("userId"), checkRole("buyer"), createOrder)

export default router

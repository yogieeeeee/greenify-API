import mongoose from "mongoose"
import Order from "../models/order.model.js"
import Cart from "../models/cart.model.js"
import Product from "../models/product.model.js"

export const createOrder = async (req, res) => {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const {shippingAddress} = req.body
    const userId = req.user.id

    // 1. Dapatkan cart pengguna
    const cart = await Cart.findOne({userId})
      .populate("items.product")
      .session(session)

    // Validasi cart
    if (!cart || cart.items.length === 0) {
      await session.abortTransaction()
      return res.status(400).json({
        success: false,
        message: "Cart is empty"
      })
    }

    // 2. Validasi stok dan siapkan update
    const bulkOps = []
    for (const item of cart.items) {
      const product = await Product.findById(item.product._id).session(session)

      if (product.stock < item.quantity) {
        await session.abortTransaction()
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`
        })
      }

      bulkOps.push({
        updateOne: {
          filter: {_id: product._id},
          update: {$inc: {stock: -item.quantity}}
        }
      })
    }

    // 3. Update stok produk
    await Product.bulkWrite(bulkOps, {session})

    // 4. Buat order
    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.priceSnapshot
    }))

    const newOrder = new Order({
      userId,
      items: orderItems,
      total: cart.total,
      shippingAddress,
      status: "pending"
    })

    const savedOrder = await newOrder.save({session})

    // 5. Hapus cart
    await Cart.deleteOne({_id: cart._id}).session(session)

    await session.commitTransaction()

    // 6. Populate data untuk response
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate("items.product", "name price image")
      .lean()

    res.status(201).json({
      success: true,
      data: populatedOrder
    })
  } catch (error) {
    await session.abortTransaction()

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(val => val.message)
      return res.status(400).json({
        success: false,
        message: messages
      })
    }

    res.status(500).json({
      success: false,
      message: error.message
    })
  } finally {
    session.endSession()
  }
}

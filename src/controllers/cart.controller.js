// controllers/cartController.js
import mongoose from "mongoose"
import Cart from "../models/cart.model.js"
import Product from "../models/product.model.js"

//////////////// GET CART ////////////////
export const getCart = async (req, res) => {
  try {
    // get user ID by req.user
    const userId = req.user.id

    // find cart with populate product data
    const cart = await Cart.findOne({userId}).populate({
      path: "items.product",
      select: "name price image stock",
      model: Product
    })

    // if cart not found
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
        data: null
      })
    }

    // Response format
    const response = {
      success: true,
      data: {
        _id: cart._id,
        userId: cart.userId,
        items: cart.items.map(item => ({
          _id: item._id,
          product: {
            _id: item.product._id,
            name: item.product.name,
            price: item.product.price,
            image: item.product.image,
            stock: item.product.stock
          },
          quantity: item.quantity,
          priceSnapshot: item.priceSnapshot,
          subtotal: item.quantity * item.priceSnapshot
        })),
        total: cart.total,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt
      }
    }

    res.status(200).json(response)
  } catch (error) {
    // Handle error
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format"
      })
    }

    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

//////////////// ADD TO CART ////////////////
export const addToCart = async (req, res) => {
  try {
    const {productId, quantity} = req.body
    const userId = req.body.userId

    // Product validation
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      })
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock"
      })
    }

    // Cari atau buat cart
    let cart = await Cart.findOne({userId})
    if (!cart) {
      cart = new Cart({
        userId,
        items: [],
        total: 0
      })
    }

    // Cek item yang sudah ada
    const existingItem = cart.items.find(
      item => item.product.toString() === productId
    )

    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      cart.items.push({
        product: productId,
        quantity,
        priceSnapshot: product.price
      })
    }

    // Update total
    cart.total = cart.items.reduce(
      (total, item) => total + item.quantity * item.priceSnapshot,
      0
    )

    await cart.save()

    res.status(200).json({
      success: true,
      data: cart
    })
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      })
    }
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

//////////////// UPDATE CART ITEM ////////////////
export const updateCartItem = async (req, res) => {
  try {
    const {itemId} = req.params
    const {quantity} = req.body
    const userId = req.user.id

    // 1. Validasi input
    if (!quantity || typeof quantity !== "number" || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity harus berupa angka minimal 1"
      })
    }

    // 2. Cari cart pengguna
    const cart = await Cart.findOne({userId})
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart tidak ditemukan"
      })
    }

    // 3. Cari item di dalam cart
    const cartItem = cart.items.id(itemId)
    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Item tidak ditemukan dalam cart"
      })
    }

    // 4. Validasi stok produk
    const product = await Product.findById(cartItem.product)
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Stok ${product.name} tidak mencukupi`
      })
    }

    // 5. Update quantity dan total
    cartItem.quantity = quantity
    cart.total = cart.items.reduce((total, item) => {
      return total + item.quantity * item.priceSnapshot
    }, 0)

    // 6. Simpan perubahan
    const updatedCart = await cart.save()

    // 7. Format response
    const formattedCart = {
      _id: updatedCart._id,
      userId: updatedCart.userId,
      total: updatedCart.total,
      items: updatedCart.items.map(item => ({
        _id: item._id,
        product: item.product,
        quantity: item.quantity,
        priceSnapshot: item.priceSnapshot,
        subtotal: item.quantity * item.priceSnapshot
      })),
      updatedAt: updatedCart.updatedAt
    }

    res.status(200).json({
      success: true,
      data: formattedCart
    })
  } catch (error) {
    // Handle error khusus
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Format ID tidak valid"
      })
    }

    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

//////////////// REMOVE FROM CART ////////////////
export const removeFromCart = async (req, res) => {
  try {
    const {itemId} = req.params
    const userId = req.user.id

    // 1. Cari cart pengguna
    const cart = await Cart.findOne({userId})

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      })
    }

    // 2. Cek apakah item ada di cart
    const initialItemCount = cart.items.length
    cart.items = cart.items.filter(item => item._id.toString() !== itemId)

    // 3. Jika tidak ada item yang terhapus
    if (cart.items.length === initialItemCount) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart"
      })
    }

    // 4. Update total
    cart.total = cart.items.reduce(
      (total, item) => total + item.quantity * item.priceSnapshot,
      0
    )

    // 5. Simpan perubahan
    await cart.save()

    // 6. Format response
    const response = {
      success: true,
      data: {
        _id: cart._id,
        removedItemId: itemId,
        newTotal: cart.total,
        remainingItems: cart.items.length
      }
    }

    res.status(200).json(response)
  } catch (error) {
    // Handle invalid ObjectId format
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid item ID format"
      })
    }

    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

import Product from "../models/product.model.js"
import fs from "fs"
import path from "path"

const validCategories = [
  "tools",
  "fertilizer",
  "seed",
  "irrigation",
  "accessories"
]

// Validate
function validateNonNegative(value, fieldName) {
  if (value < 0) {
    return `${fieldName} cannot be worth less than 0`
  }
  return null
}

////////// CREATE NEW PRODUCT //////////
export const createProduct = async (req, res) => {
  try {
    const {name, stock, price, description, category} = req.body
    const image = req.files?.image

    const stockError = validateNonNegative(stock, "stock")
    const priceError = validateNonNegative(price, "price")

    if (stockError || priceError) {
      return res.status(400).json({
        success: false,
        message: stockError || priceError
      })
    }

    // Iamge validation
    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Image is required"
      })
    }

    // Category validation
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product category"
      })
    }

    // Path upload configuration
    const uploadDir = path.join(process.cwd(), "public", "uploads")
    const fileName = `${Date.now()}_${image.name.replace(/\s/g, "_")}`
    const filePath = path.join(uploadDir, fileName)

    // Buat folder jika belum ada
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, {recursive: true})
    }

    // Pindahkan gambar ke folder upload
    await image.mv(filePath)

    // Create new product
    const product = await Product.create({
      name,
      stock: Number(stock),
      price: Number(price),
      image: `/uploads/${fileName}`, // Save relative path
      description,
      category
    })

    res.status(201).json({
      success: true,
      data: product
    })
  } catch (error) {
    // Handle error validasi Mongoose
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(val => val.message)
      return res.status(400).json({
        success: false,
        message: messages
      })
    }

    // Handle error umum
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

////////// GET ALL PRODUCT //////////
export const getAllProducts = async (req, res) => {
  try {
    // Parse query parameters
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    // Build filter object
    const filter = {}
    const validCategories = [
      "tools",
      "fertilizer",
      "seed",
      "irrigation",
      "accessories"
    ]

    // 1. FILTER BERDASARKAN KATEGORI
    if (req.query.category) {
      if (!validCategories.includes(req.query.category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category value"
        })
      }
      filter.category = req.query.category
    }

    // 2. FILTER HARGA
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {}
      if (req.query.minPrice) {
        filter.price.$gte = parseFloat(req.query.minPrice)
      }
      if (req.query.maxPrice) {
        filter.price.$lte = parseFloat(req.query.maxPrice)
      }
    }

    // 4. SISTEM PENCARIAN (BARU)
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i")
      filter.$or = [
        {name: {$regex: searchRegex}},
        {description: {$regex: searchRegex}}
      ]
    }

    // Eksekusi query dengan filter
    const [total, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .sort({publishedAt: -1})
        .skip(skip)
        .limit(limit)
        .lean()
    ])

    // Format response
    const totalPages = Math.ceil(total / limit)
    const baseUrl = `${req.protocol}://${req.get("host")}/public`
    const formattedProducts = products.map(product => ({
      ...product,
      image: `${baseUrl}${product.image}`
    }))

    res.status(200).json({
      success: true,
      data: formattedProducts,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts: total,
        limit
      },
      appliedFilters: {
        ...req.query,
        searchTerm: req.query.search // Tambahkan field khusus untuk search
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

////////// GET PRODUCT BY ID //////////
export const getProductById = async (req, res) => {
  try {
    const {productId} = req.params

    // Cari produk berdasarkan ID
    const product = await Product.findById(productId).lean()

    // Validasi jika produk tidak ditemukan
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      })
    }

    // Format URL gambar lengkap
    const baseUrl = `${req.protocol}://${req.get("host")}/public`
    const formattedProduct = {
      ...product,
      image: `${baseUrl}${product.image}`
    }

    res.status(200).json({
      success: true,
      data: formattedProduct
    })
  } catch (error) {
    // Handle invalid ObjectId format
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format"
      })
    }

    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

////////// UPDATE PRODUCT //////////
export const updateProduct = async (req, res) => {
  try {
    const {productId} = req.params
    const {name, stock, price, description, category} = req.body
    const image = req.files?.image

    // Validasi ID produk
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      })
    }

    // Handle image update
    let imagePath = product.image
    if (image) {
      // Hapus gambar lama
      const oldImagePath = path.join(process.cwd(), "public", product.image)
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath)
      }

      // Upload gambar baru
      const uploadDir = path.join(process.cwd(), "public", "uploads")
      const fileName = `${Date.now()}_${image.name.replace(/\s/g, "_")}`
      const filePath = path.join(uploadDir, fileName)

      await image.mv(filePath)
      imagePath = `/uploads/${fileName}`
    }

    // Update field lainnya
    const updatedData = {
      name: name || product.name,
      stock: Number(stock) || product.stock,
      price: Number(price) || product.price,
      description: description || product.description,
      category: category || product.category,
      image: imagePath
    }

    // Validasi kategori
    const validCategories = [
      "tools",
      "fertilizer",
      "seed",
      "irrigation",
      "accessories"
    ]
    if (
      updatedData.category &&
      !validCategories.includes(updatedData.category)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid product category"
      })
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true
    })

    res.status(200).json({
      success: true,
      data: updatedProduct
    })
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format"
      })
    }
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
  }
}

////////// DELETE PRODUCT //////////
export const deleteProduct = async (req, res) => {
  try {
    const {productId} = req.params
    const product = await Product.findByIdAndDelete(lroductId)
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      })
    }

    // Hapus gambar dari server
    const imagePath = path.join(process.cwd(), "public", product.image)
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath)
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully"
    })
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format"
      })
    }
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

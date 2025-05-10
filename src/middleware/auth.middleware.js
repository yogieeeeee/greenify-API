import jwt from "jsonwebtoken"
import User from "../models/user.model.js"

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token is invalid or unavailable"
      })
    }

    const token = authHeader.split(" ")[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Search user in database
    const user = await User.findById(decoded.id)

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User cannot found"
      })
    }

    // Attach user to request object
    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    }
    next()
  } catch (error) {
    console.error("Error otorisasi:", error)
    res.status(401).json({
      success: false,
      message: "Session has expired or token is invalid"
    })
  }
}

export default authMiddleware

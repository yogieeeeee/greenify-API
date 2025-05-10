import bcryptjs from "bcryptjs"
import validator from "validator"
import jwt from "jsonwebtoken"
import User from "../models/user.model.js"
import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()

///////// create user or register ///////////
export const register = async (req, res) => {
  const {name, email, password} = req.body

  // validate if the input is empty
  if (!name || !email || !password) {
    return res.status(400).json({message: "All fields are required"})
  }

  // check email is registered
  const existingUser = await User.findOne({email})
  if (existingUser) {
    return res.status(400).json({message: "The email is already registered"}) // return error
  }

  // Validate email format
  if (!validator.isEmail(email)) {
    return res.status(400).json({message: "The email isn't valid"}) // return error
  }

  // Hash password
  const salt = await bcryptjs.genSalt(10)
  const hashedPassword = await bcryptjs.hash(password, salt)

  try {
    // Save new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword
    }) // Save the hashed password
    await newUser.save()

    // Send successfully respon
    res.status(201).json({message: "Account created successfully"})
  } catch (error) {
    // Tangani error
    res.status(500).json({message: "Something went wrong with the server"}) // Return error
  }
}

/////////////// login user //////////////
export const login = async (req, res) => {
  try {
    const {email, password} = req.body

    // Check if the input empty
    if (!email || !password) {
      return res.status(400).json({message: "Email and password are required"})
    }

    // Check if the email is registered
    const user = await User.findOne({email}).select("+password")
    if (!user) {
      return res.status(400).json({message: "Incorrect email or password"})
    }

    // Compare the passwords
    const isMatch = await bcryptjs.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({message: "Incorrect email or password"})
    }

    // Create access token
    const accessToken = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
        email: user.email,
        isActive: user.isActive
      },
      process.env.JWT_SECRET, // Using environment variable
      {expiresIn: "1h"}
    )

    // Create refresh token
    const refreshToken = jwt.sign(
      {userId: user._id, role: user.role, email: user.email},
      process.env.REFRESH_KEY,
      {expiresIn: "7d"}
    )

    // Save refresh token in database
    user.refreshToken = refreshToken
    await user.save()

    // Send respons to client
    res.status(200).json({
      message: "Login successfully",
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    })
  } catch (error) {
    console.error("Login Error:", error)
    res.status(500).json({message: `server error occurred: ${error.message}`}) // Return error
  }
}

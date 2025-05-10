import User from "../models/user.model.js"
import bcryptjs from "bcryptjs"
import dotenv from "dotenv"
dotenv.config()

const createAdmin = async () => {
  const adminExists = await User.findOne({role: "admin"})
  if (!adminExists) {
    const admin = new User({
      name: process.env.ADMIN_NAME, // add name
      email: process.env.ADMIN_EMAIL, // add email
      password: await bcryptjs.hash(process.env.ADMIN_PASSWORD, 10),
      role: "admin"
    })

    try {
      await admin.save()
      console.log("Admin success created")
    } catch (err) {
      console.error("Failed to create admin:", err.message)
    }
  }
}

export default createAdmin

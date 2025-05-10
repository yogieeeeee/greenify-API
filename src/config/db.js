import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()
// db.js
const connectDB = async () => {
  try {
    // Using the Environment Variable for Connection String
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    })

    console.log(`MongoDB Connected: ${conn.connection.host} 4000`)
  } catch (error) {
    console.error(`Error: ${error.message}`)
    process.exit(1) // exit if had error on the process
  }
}

export default connectDB

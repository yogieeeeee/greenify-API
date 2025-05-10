import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import upload from "express-fileupload"
const app = express()

import createAdmin from "./setup/createAdmin.js"
import connectDB from "./config/db.js"

import authRoute from "./routers/auth.route.js"
import adminRoute from "./routers/admin.route.js"
import buyerRoute from "./routers/buyer.route.js"

connectDB()
createAdmin()
//app.use(cors)
app.use(express.json())
// File upload middleware
app.use(upload())

// the routers
app.use("/api/auth", authRoute)
app.use("/api/admin", adminRoute)
app.use("/api/buyer", buyerRoute)

app.listen(4000, () => {
  console.log(`server is runninh on port 4000`)
})

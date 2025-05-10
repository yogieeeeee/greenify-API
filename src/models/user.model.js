import mongoose from "mongoose"
const Schema = mongoose.Schema

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ["admin", "buyer"],
    default: "buyer"
  },
  refreshToken: {
    type: String,
    select: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

// Index untuk optimasi pencarian
userSchema.index({email: 1, username: 1})

export default mongoose.model("User", userSchema)

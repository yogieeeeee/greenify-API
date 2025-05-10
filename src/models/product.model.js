import mongoose from "mongoose"
const Schema = mongoose.Schema

const productSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  stock: {
    type: Number,
    required: true,
    default: 0
  },
  price: {
    type: Number,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  description: {
    type: String,
    maxLength: 500,
    required: true
  },
  category: {
    type: String,
    enum: ["tools", "fertilizer", "seed", "irrigation", "accessories"],
    required: true
  },
  publishedAt: {
    type: Date,
    default: Date.now
  }
})
export default mongoose.model("product", productSchema)

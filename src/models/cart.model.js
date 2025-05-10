import mongoose from "mongoose"
const Schema = mongoose.Schema

const cartSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: 1
        },
        priceSnapshot: Number // Harga saat ditambahkan ke keranjang
      }
    ],
    total: {
      type: Number,
      default: 0
    }
  },
  {timestamps: true}
)

export default mongoose.model("Cart", cartSchema)

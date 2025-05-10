import mongoose from "mongoose"
const Schema = mongoose.Schema

const orderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },
        quantity: Number,
        price: Number
      }
    ],
    total: Number,
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending"
    },
    shippingAddress: {
      type: String,
      required: true
    }
  },
  {timestamps: true}
)

export default mongoose.model("order", orderSchema)

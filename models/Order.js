const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    products: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    shippingAddress: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    orderNotes: { type: String, default: "" },
    paymentMethod: {
      type: String,
      enum: ["Cash on Delivery", "JazzCash", "EasyPaisa", "Bank Account"],
      required: true,
      default: "Cash on Delivery",
    },
    paymentDetails: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
    orderDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
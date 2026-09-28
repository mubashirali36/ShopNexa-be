const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const placeOrder = async (req, res, next) => {
  try {
    const { fullName, email, phone, shippingAddress, city, postalCode, orderNotes, paymentMethod, paymentDetails } = req.body;

    if (!fullName || !email || !phone || !shippingAddress || !city || !postalCode || !paymentMethod) {
      return res.status(400).json({ message: "Please fill in all required checkout fields including payment method" });
    }

    if (paymentMethod !== "Cash on Delivery" && !paymentDetails) {
      return res.status(400).json({ message: "Please provide account or phone details for the selected payment method" });
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Your cart is empty" });
    }
    for (const item of cart.items) {
      const product = item.product;
      if (!product) {
        return res.status(400).json({ message: "One of the products in your cart no longer exists" });
      }
      if (item.quantity > product.stock) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }
    }

    const orderItems = cart.items.map((item) => ({
      product: item.product._id,
      name: item.product.name,
      image: item.product.image.url,
      price: item.product.price,
      quantity: item.quantity,
    }));

    const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = await Order.create({
      user: req.user._id,
      products: orderItems,
      totalAmount,
      fullName,
      email,
      phone,
      shippingAddress,
      city,
      postalCode,
      orderNotes: orderNotes || "",
      paymentMethod,
      paymentDetails: paymentDetails || "",
    });

  
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, { $inc: { stock: -item.quantity } });
    }

    cart.items = [];
    await cart.save();

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
};
const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().populate("user", "name email").sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
};


const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email");
    if (!order) return res.status(404).json({ message: "Order not found" });

    const isOwner = order.user._id.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to view this order" });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;
    const updated = await order.save();
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

module.exports = { placeOrder, getMyOrders, getAllOrders, getOrderById, updateOrderStatus };
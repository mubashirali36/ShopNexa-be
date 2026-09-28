const Cart = require("../models/Cart");
const Product = require("../models/Product");

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
};
const getCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    await cart.populate("items.product");
    res.json(cart);
  } catch (error) {
    next(error);
  }
};
const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const cart = await getOrCreateCart(req.user._id);
    const existingItem = cart.items.find((item) => item.product.toString() === productId);

    const requestedQty = existingItem ? existingItem.quantity + Number(quantity) : Number(quantity);

    if (requestedQty > product.stock) {
      return res.status(400).json({ message: `Only ${product.stock} items in stock` });
    }

    if (existingItem) {
      existingItem.quantity = requestedQty;
    } else {
      cart.items.push({ product: productId, quantity: Number(quantity) });
    }

    await cart.save();
    await cart.populate("items.product");
    res.status(201).json(cart);
  } catch (error) {
    next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.id(req.params.id);
    if (!item) return res.status(404).json({ message: "Cart item not found" });

    const product = await Product.findById(item.product);
    if (Number(quantity) > product.stock) {
      return res.status(400).json({ message: `Only ${product.stock} items in stock` });
    }
    if (Number(quantity) < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    item.quantity = Number(quantity);
    await cart.save();
    await cart.populate("items.product");
    res.json(cart);
  } catch (error) {
    next(error);
  }
};

const removeCartItem = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter((item) => item._id.toString() !== req.params.id);
    await cart.save();
    await cart.populate("items.product");
    res.json(cart);
  } catch (error) {
    next(error);
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeCartItem };

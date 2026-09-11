const express = require("express");
const { getCart, addToCart, updateCartItem, removeCartItem } = require("../controllers/cartController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getCart);
router.post("/", protect, addToCart);
router.put("/:id", protect, updateCartItem);
router.delete("/:id", protect, removeCartItem);

module.exports = router;

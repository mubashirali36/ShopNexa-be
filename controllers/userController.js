const validator = require("validator");
const User = require("../models/User");
const Order = require("../models/Order");
const Product = require("../models/Product");
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const isSelf = req.user._id.toString() === req.params.id;
    const isAdmin = req.user.role === "admin";

    if (!isSelf && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to update this user" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { name, email, phone, password, role } = req.body;

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (email) {
      if (!validator.isEmail(email)) {
        return res.status(400).json({ message: "Please enter a valid email" });
      }
      user.email = email;
    }
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      user.password = password;
    }
    if (role && isAdmin) {
      user.role = role;
    }

    const updated = await user.save();

    res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      role: updated.role,
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot delete your own account here" });
    }

    await user.deleteOne();
    res.json({ message: "User removed" });
  } catch (error) {
    next(error);
  }
};

const getAdminStats = async (req, res, next) => {
  try {
    const [totalUsers, totalCustomers, totalAdmins, totalProducts, totalOrders, orders, recentOrders, recentUsers] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: "customer" }),
        User.countDocuments({ role: "admin" }),
        Product.countDocuments(),
        Order.countDocuments(),
        Order.find(),
        Order.find().sort({ createdAt: -1 }).limit(5).populate("user", "name email"),
        User.find().sort({ createdAt: -1 }).limit(5).select("name email role createdAt"),
      ]);

    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    res.json({
      totalUsers,
      totalCustomers,
      totalAdmins,
      totalProducts,
      totalOrders,
      totalRevenue,
      recentOrders,
      recentUsers,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, getUserById, updateUser, deleteUser, getAdminStats };

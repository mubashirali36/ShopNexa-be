const Category = require("../models/Category");
const Product = require("../models/Product");
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Category name is required" });

    const exists = await Category.findOne({ name: name.trim() });
    if (exists) return res.status(400).json({ message: "Category already exists" });

    const category = await Category.create({ name: name.trim() });
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    if (req.body.name) category.name = req.body.name.trim();
    const updated = await category.save();
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    const inUse = await Product.exists({ category: category._id });
    if (inUse) {
      return res.status(400).json({ message: "Cannot delete category in use by products" });
    }

    await category.deleteOne();
    res.json({ message: "Category removed" });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };

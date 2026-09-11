const Product = require("../models/Product");
const cloudinary = require("../config/cloudinary");

// @desc Get all products (supports search, category filter, pagination)
// @route GET /api/products
const getProducts = async (req, res, next) => {
  try {
    const { search, category, page = 1, limit = 20, sort } = req.query;
    const query = {};

    if (search) {
      query.$text = { $search: search };
    }
    if (category) {
      query.category = category;
    }

    let sortOption = { createdAt: -1 };
    if (sort === "price_asc") sortOption = { price: 1 };
    if (sort === "price_desc") sortOption = { price: -1 };

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(query).populate("category", "name").sort(sortOption).skip(skip).limit(Number(limit)),
      Product.countDocuments(query),
    ]);

    res.json({
      products,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get single product
// @route GET /api/products/:id
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate("category", "name");
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    next(error);
  }
};

// @desc Create product (admin)
// @route POST /api/products
const createProduct = async (req, res, next) => {
  try {
    const { name, description, category, price, stock } = req.body;

    if (!name || !description || !category || price === undefined || stock === undefined) {
      return res.status(400).json({ message: "Please fill in all product fields" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Product image is required" });
    }

    const product = await Product.create({
      name,
      description,
      category,
      price: Number(price),
      stock: Number(stock),
      image: {
        url: req.file.path,
        publicId: req.file.filename,
      },
    });

    const populated = await product.populate("category", "name");

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

// @desc Update product (admin)
// @route PUT /api/products/:id
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const { name, description, category, price, stock } = req.body;

    if (name) product.name = name;
    if (description) product.description = description;
    if (category) product.category = category;
    if (price !== undefined) product.price = Number(price);
    if (stock !== undefined) product.stock = Number(stock);

    if (req.file) {
      // Remove old image from Cloudinary
      if (product.image?.publicId) {
        await cloudinary.uploader.destroy(product.image.publicId).catch(() => {});
      }
      product.image = { url: req.file.path, publicId: req.file.filename };
    }

    const updated = await product.save();
    const populated = await updated.populate("category", "name");

    res.json(populated);
  } catch (error) {
    next(error);
  }
};

// @desc Delete product (admin)
// @route DELETE /api/products/:id
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (product.image?.publicId) {
      await cloudinary.uploader.destroy(product.image.publicId).catch(() => {});
    }

    await product.deleteOne();
    res.json({ message: "Product removed" });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };

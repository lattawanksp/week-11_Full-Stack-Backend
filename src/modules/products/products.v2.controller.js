import { Product } from "./product.model.js";

export const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    return res.status(200).json({ sucess: true, data: products });
  } catch (error) {
    return res.status(400).json({ sucess: false, error: error.message });
  }
};

export const createProduct = async (req, res) => {
  const { name, price, category } = req.body || {};

  if (!name || !price || !category) {
    return res
      .status(400)
      .json({ success: false, error: "name, price and category are required" });
  }

  try {
    const product = await Product.create({ name, price, category });
    return res.status(201).json({ success: true, data: product });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

export const updateProduct = async (req, res) => {
  const { name, price, category } = req.body || {};

  if (!name || !price || !category) {
    return res
      .status(400)
      .json({ success: false, error: "name, price and category are required" });
  }

  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, price, category },
      { new: true },
    );

    if (!product)
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });

    return res.status(200).json({ success: true, data: product });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product)
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });

    return res
      .status(200)
      .json({ success: true, message: "Delete product successfully" });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

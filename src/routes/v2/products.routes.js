import { Router } from "express";
import { Product } from "../../modules/products/product.model.js";
import { supabase } from "../../config/supabase.js";

export const router = Router();

//MongoDB routes (/api/v2/products)

router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    return res.status(200).json({ sucess: true, data: products });
  } catch (error) {
    return res.status(400).json({ sucess: false, error: error.message });
  }
});

router.post("/", async (req, res) => {
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
});

router.put("/:id", async (req, res) => {
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
});

router.delete("/:id", async (req, res) => {
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
});

// Supabase / PostgreSQL routes (/api/v2/products/pg)

const PG_SELECT = "id, name, price, category, created_at, updated_at";

router.get("/pg", async (req, res) => {
  try {
    const { data, error } = await supabase.from("products").select(PG_SELECT);

    if (error) throw error;

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

router.post("/pg", async (req, res) => {
  const { name, price, category } = req.body || {};

  if (!name || !price || !category) {
    return res.status(400).json({
      success: false,
      error: "name, price and category are required",
    });
  }

  try {
    const { data, error } = await supabase
      .from("products")
      .insert({ name, price, category })
      .select(PG_SELECT)
      .single();

    if (error) throw error;

    return res.status(201).json({ success: true, data });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

router.put("/pg/:id", async (req, res) => {
  const { name, price, category } = req.body || {};

  const updates = {};
  if (name) updates.name = name;
  if (price) updates.price = price;
  if (category) updates.category = category;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      success: false,
      error: "At least one field is required to update",
    });
  }

  try {
    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", req.params.id)
      .select(PG_SELECT)
      .single();

    if (error) throw error;

    if (!data) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found!" });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

router.delete("/pg/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .delete()
      .eq("id", req.params.id)
      .select(PG_SELECT)
      .single();

    if (error) throw error;

    if (!data) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found!" });
    }

    return res.status(200).json({
      success: true,
      message: "Delete product successfully!",
      data,
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

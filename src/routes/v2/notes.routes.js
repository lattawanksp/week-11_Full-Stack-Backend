import { Router } from "express";
import { Note } from "../../modules/notes/notes.model.js";
import { supabase } from "../../config/supabase.js";

export const router = Router();

// MongoDB routes (/api/v2/notes)

router.get("/", async (req, res) => {
  try {
    const notes = await Note.find();
    return res.status(200).json({ success: true, data: notes });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

router.post("/", async (req, res) => {
  const { title, content, category, status } = req.body || {};

  if (!title || !content || !category) {
    return res.status(400).json({
      success: false,
      error: "title, content and category are required",
    });
  }

  try {
    const note = await Note.create({ title, content, category, status });
    return res.status(201).json({ success: true, data: note });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  const { title, content, category, status } = req.body || {};

  if (!title || !content || !category) {
    return res.status(400).json({
      success: false,
      error: "title, content and category are required",
    });
  }

  try {
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { title, content, category, status },
      { new: true },
    );

    if (!note)
      return res.status(404).json({ success: false, error: "Note not found" });

    return res.status(200).json({ success: true, data: note });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);

    if (!note)
      return res.status(404).json({ success: false, error: "Note not found" });

    return res
      .status(200)
      .json({ success: true, message: "Delete note successfully" });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// Supabase / PostgreSQL routes (/api/v2/notes/pg)

const PG_SELECT = "id, title, content, category, status, created_at";

router.get("/pg", async (req, res) => {
  try {
    const { data, error } = await supabase.from("notes").select(PG_SELECT);

    if (error) throw error;

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

router.post("/pg", async (req, res) => {
  const { title, content, category, status } = req.body || {};

  if (!title || !content || !category) {
    return res.status(400).json({
      success: false,
      error: "title, content and category are required",
    });
  }

  try {
    const { data, error } = await supabase
      .from("notes")
      .insert({ title, content, category, status: status || "Todo" })
      .select(PG_SELECT)
      .single();

    if (error) throw error;

    return res.status(201).json({ success: true, data });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

router.put("/pg/:id", async (req, res) => {
  const { title, content, category, status } = req.body || {};

  const updates = {};
  if (title) updates.title = title;
  if (content) updates.content = content;
  if (category) updates.category = category;
  if (status) updates.status = status;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      success: false,
      error: "At least one field is required to update",
    });
  }

  try {
    const { data, error } = await supabase
      .from("notes")
      .update(updates)
      .eq("id", req.params.id)
      .select(PG_SELECT)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ success: false, error: "Note not found!" });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

router.delete("/pg/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("notes")
      .delete()
      .eq("id", req.params.id)
      .select(PG_SELECT)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ success: false, error: "Note not found!" });
    }

    return res.status(200).json({
      success: true,
      message: "Delete note successfully!",
      data,
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

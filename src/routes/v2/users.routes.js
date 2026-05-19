import { Router } from "express";
import { User } from "../../modules/users/user.model.js";
import { supabase } from "../../config/supabase.js";

export const router = Router();

//MongoDB routes (/api/v2/users)
const userResponse = (doc) => {
  const user = doc.toObject();
  delete user.password;
  return user;
};

router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    return res.status(400).json({ sucess: false, error: error.message });
  }
});

router.post("/", async (req, res) => {
  // 1. ใช้ Destructuring ดึงข้อมูล และป้องกัน error ด้วยการใส่ || {}
  const { username, email, password, role } = req.body || {};

  // 2. ตรวจสอบว่ามีข้อมูลครบถ้วนหรือไม่
  if (!username || !email || !password) {
    const err = new Error("username, email, and password are required");
    err.name = "ValidationError";
    err.status = 400;
    return res.status(400).json({ success: false, error: err });
  }

  try {
    const doc = await User.create({ username, email, password, role });

    return res.status(201).json({ success: true, data: userResponse(doc) });
  } catch (err) {
    return res.status(400).json({ success: false, error: err });
  }
});

router.put("/:id", async (req, res) => {
  const { username, email, password } = req.body || {};

  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ error: "username, email and password are required!" });
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { username, email, password },
    { new: true }, // ← สำคัญมาก! บอกให้คืนข้อมูลหลัง update
  );

  if (!user) return res.status(404).json({ error: "User not found!" });

  return res.status(200).json({ success: true, data: user });
});

router.delete("/:id", async (req, res) => {
  // 1. หาตำแหน่งของ user จาก id ที่ส่งมาใน URL
  const deleted = await User.findByIdAndDelete(req.params.id);

  // 2. ถ้าไม่เจอ user ให้ส่ง error 404 กลับไป
  if (!deleted) {
    return res.status(404).json({ error: "User not found!" });
  }
  // 3. ส่งผลลัพธ์กลับไปเมื่อ delete สำเร็จ
  return res.status(200).json({
    message: "Delete user successfully!",
    user: deleted,
  });
});

//Supabase / PostgreSQL routes (/api/v2/users/pg)
// Password is excluded from SELECT.

const PG_SELECT = "id, username, email, role, created_at, updated_at";

router.get("/pg", async (req, res) => {
  try {
    const { data, error } = await supabase.from("users").select(PG_SELECT);

    if (error) throw error;

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

router.post("/pg", async (req, res) => {
  const { username, email, password, role } = req.body || {};

  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      error: "username, email, and password are required",
    });
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .insert({ username, email, password, role: role || "user" })
      .select(PG_SELECT)
      .single();

    if (error) throw error;

    return res.status(201).json({ success: true, data });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

router.put("/pg/:id", async (req, res) => {
  const { username, email, password, role } = req.body || {};

  // เอาเฉพาะ field ที่ส่งมาจริงๆ
  const updates = {};
  if (username) updates.username = username;
  if (email) updates.email = email;
  if (password) updates.password = password;
  if (role) updates.role = role;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      success: false,
      error: "At least one field is required to update",
    });
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", req.params.id)
      .select(PG_SELECT)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ success: false, error: "User not found!" });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

router.delete("/pg/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .delete()
      .eq("id", req.params.id)
      .select(PG_SELECT)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ success: false, error: "User not found!" });
    }

    return res.status(200).json({
      success: true,
      message: "Delete user successfully!",
      data,
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

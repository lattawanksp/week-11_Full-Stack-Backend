import { User } from "./user.model.js";

const userResponse = (doc) => {
  const user = doc.toObject();
  delete user.password;
  return user;
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    return res.status(400).json({ sucess: false, error: error.message });
  }
};

export const createUser = async (req, res) => {
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
};

export const updateUser = async (req, res) => {
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
};

export const deleteUser = async (req, res) => {
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
};

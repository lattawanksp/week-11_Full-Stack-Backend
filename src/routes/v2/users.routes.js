import { Router } from "express";
import { users } from "../../fakeData/fakeUser.js";
import { User } from "../../modules/users/user.model.js";

export const router = Router();

const userResponse = (doc) => {
  const user = doc.toObject();
  delete user.password;
  return user;
};

router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    return res.status(200).json({ success: true, data: users });
  } catch {
    error;
  }
  {
    return res.status(400).json({ sucess: false, error: error });
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
  // 1. ค้นหา User จาก ID ที่ส่งมาใน URL (req.params.id)
  const user = users.find((u) => u.id === req.params.id);
  // 2. ถ้าหา User ไม่เจอ ให้ส่ง Error 404 กลับไป
  if (!user) {
    return res.status(404).json({ error: "User not found!" });
  }
  // 3. ใช้ Destructuring ดึงค่าใหม่จาก req.body
  const { username, email, password } = req.body;
  // 4. ตรวจสอบว่าส่งข้อมูลมาครบหรือไม่ (username, email และ password)
  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ error: "username, email and password are required!" });
  }
  // 5. อัปเดตข้อมูลใน Object เดิมด้วยค่าใหม่ที่รับมา
  user.username = username;
  user.email = email;
  user.password = password;
  // 6. ส่งข้อมูลที่อัปเดตแล้วกลับไปพร้อม Status 200 OK
  res.status(200).json(user);
});

router.delete("/:id", async (req, res) => {
  // 1. หาตำแหน่งของ user จาก id ที่ส่งมาใน URL
  const userIndex = users.findIndex((u) => u.id === req.params.id);

  // 2. ถ้าไม่เจอ user ให้ส่ง error 404 กลับไป
  if (userIndex === -1) {
    return res.status(404).json({ error: "User not found!" });
  }

  // 3. ลบ user ออกจาก array และเก็บข้อมูลที่ถูกลบไว้
  const deletedUser = users.splice(userIndex, 1)[0];

  // 4. ส่งผลลัพธ์กลับไปเมื่อ delete สำเร็จ
  return res.status(200).json({
    message: "Delete user successfully!",
    user: deletedUser,
  });
});

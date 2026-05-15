import { Router } from "express";

export const router = Router();

router.post("/", (req, res) => {
  // 1. ใช้ Destructuring ดึงข้อมูล และป้องกัน error ด้วยการใส่ || {}
  const { username, email } = req.body || {};
  // 2. ตรวจสอบว่ามีข้อมูลครบถ้วนหรือไม่
  if (!username || !email) {
    return res.status(400).json({ error: "username and email are required" });
  }
  // 3. คำนวณหา ID ตัวถัดไป (Simple incremental string id)
  const nextId = String(
    (users.reduce((max, u) => Math.max(max, Number(u.id)), 0) || 0) + 1,
  );
  // 4. สร้าง User Object ใหม่ (ใช้ Shorthand สำหรับ username และ email)
  const newUser = { id: nextId, username, email };
  // 5. บันทึกลงใน Array และตอบกลับ Client
  users.push(newUser);
  return res.status(201).json(newUser);
});

router.put("/:id", (req, res) => {
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

router.delete("/:id", (req, res) => {
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

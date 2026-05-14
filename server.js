import express from "express";
import cors from "cors";

import { users } from "./src/fakeData/fakeUser.js";

const app = express();

app.use(cors());

app.use(express.json());

app.get("/", (req, res) => {
  res.send(`<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Express + Tailwind</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="min-h-screen bg-gray-50 text-gray-800">
      <main class="max-w-2xl mx-auto p-8">
        <div class="rounded-xl bg-white shadow-sm ring-1 ring-gray-100 p-8">
          <h1 class="text-3xl font-bold tracking-tight text-blue-600">
            Hello Client, I am your Server!
          </h1>
          <p class="mt-3 text-gray-600">
            This page is styled with <span class="font-semibold">Tailwind CSS</span> via CDN.
          </p>
          <div class="mt-6 flex flex-wrap items-center gap-3">
            <a href="/api/v2/users" class="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              GET /users
            </a>
            <span class="text-xs text-gray-500">Try POST/PUT/DELETE with your API client.</span>
          </div>
        </div>
        <footer class="mt-10 text-center text-xs text-gray-400">
          Express server running with Tailwind via CDN
        </footer>
      </main>
    </body>
  </html>`);
});

app.get("/users", (req, res) => {
  res.json(users);
});

app.post("/users", (req, res) => {
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

// app.delete();

app.put("/users/:id", (req, res) => {
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

const PORT = 3002;

app.listen(PORT, () => {
  console.log(`Server running on PORT: ${PORT} 🌍`);
});

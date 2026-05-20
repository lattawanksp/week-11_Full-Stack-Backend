import { User } from "./user.model.js";
import bcrypt from "bcrypt";

const userResponse = (doc) => {
  const user = doc.toObject();
  delete user.password;
  return user;
};

export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    return res.status(200).json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

//register
export const createUser = async (req, res, next) => {
  const { username, email, password, role } = req.body || {};

  if (!username || !email || !password) {
    const err = new Error("username, email, and password are required");
    err.name = "ValidationError";
    err.status = 400;
    return next(err); // ✅ โยนให้ middleware จัดการแทน
  }

  try {
    // เช็คว่า email ซ้ำไหม
    const userExists = await User.findOne({ email });
    if (userExists) {
      const err = new Error("อีเมลนี้ถูกใช้งานแล้ว");
      err.name = "ValidationError";
      err.status = 400;
      return next(err);
    }

    const doc = await User.create({
      username,
      email,
      password,
      role,
    });
    return res.status(201).json({ success: true, data: userResponse(doc) });
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  const { username, email, password } = req.body || {};

  if (!username || !email || !password) {
    const err = new Error("username, email and password are required!");
    err.name = "ValidationError";
    err.status = 400;
    return next(err); // ✅
  }

  try {
    // ✅ ต้องครอบ try/catch
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { username, email, password },
      { new: true },
    );

    if (!user) {
      const err = new Error("User not found!");
      err.status = 404;
      return next(err); // ✅
    }

    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err); // ✅
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    // ✅ ครอบ try/catch
    const deleted = await User.findByIdAndDelete(req.params.id);

    if (!deleted) {
      const err = new Error("User not found!");
      err.status = 404;
      return next(err); // ✅
    }

    return res.status(200).json({
      message: "Delete user successfully!",
      user: deleted,
    });
  } catch (err) {
    next(err); // ✅
  }
};

// login
export const loginUser = async (req, res, next) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    const err = new Error("email and password are required");
    err.name = "ValidationError";
    err.status = 400;
    return next(err);
  }

  try {
    // หา user จาก email
    const userInDB = await User.findOne({ email }).select("+password");

    console.log("userInDB:", userInDB);
    console.log("password from request:", password);
    console.log("password in DB:", userInDB?.password);

    if (!userInDB) {
      const err = new Error("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      err.status = 401;
      return next(err);
    }

    // เช็ค password
    const isMatch = await bcrypt.compare(password, userInDB.password);
    if (!isMatch) {
      const err = new Error("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      err.status = 401;
      return next(err);
    }

    return res
      .status(200)
      .json({ success: true, message: "เข้าสู่ระบบสำเร็จ!" });
  } catch (err) {
    next(err);
  }
};

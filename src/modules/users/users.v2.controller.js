import { User } from "./user.model.js";

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

export const createUser = async (req, res, next) => {
  const { username, email, password, role } = req.body || {};

  if (!username || !email || !password) {
    const err = new Error("username, email, and password are required");
    err.name = "ValidationError";
    err.status = 400;
    return next(err); // ✅ โยนให้ middleware จัดการแทน
  }

  try {
    const doc = await User.create({ username, email, password, role });
    return res.status(201).json({ success: true, data: userResponse(doc) });
  } catch (err) {
    next(err); // ✅ next(err) ต้องมาก่อน return
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

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { User } from "./user.model.js";
import {
  buildUserEmbedding,
  cosineSimilarity,
} from "./user.embedding.js";
import {
  createQueryEmbedding,
  generateUserAnswer,
} from "../../services/gemini.client.js";

const USER_VECTOR_INDEX = process.env.USER_VECTOR_INDEX || "user_embedding_index";

const userResponse = (doc) => {
  const user = doc.toObject();
  delete user.password;
  delete user.embedding;
  return user;
};

const ensureRequiredFields = (fields) => {
  const missingFields = fields.filter((field) => !field.value);

  if (missingFields.length > 0) {
    const err = new Error(
      `${missingFields.map((field) => field.name).join(", ")} are required`,
    );
    err.name = "ValidationError";
    err.status = 400;
    throw err;
  }
};

async function syncEmbeddingForUser(userDoc) {
  const embedding = await buildUserEmbedding(userDoc);
  userDoc.embedding = embedding;
  await userDoc.save();
  return userDoc;
}

async function ensureEmbeddingsForUsers(users) {
  const missingEmbeddingUsers = users.filter(
    (user) => !Array.isArray(user.embedding) || user.embedding.length === 0,
  );

  for (const user of missingEmbeddingUsers) {
    await syncEmbeddingForUser(user);
  }

  return users;
}

async function vectorSearchUsers(queryEmbedding, limit) {
  return User.aggregate([
    {
      $vectorSearch: {
        index: USER_VECTOR_INDEX,
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates: Math.max(limit * 10, 20),
        limit,
      },
    },
    {
      $project: {
        username: 1,
        email: 1,
        role: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]);
}

async function localSimilaritySearch(queryEmbedding, limit) {
  const users = await User.find().select("+embedding");
  await ensureEmbeddingsForUsers(users);

  return users
    .map((user) => ({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      score: cosineSimilarity(queryEmbedding, user.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

async function retrieveRelevantUsers(question, limit) {
  const queryEmbedding = await createQueryEmbedding(question);

  try {
    return await vectorSearchUsers(queryEmbedding, limit);
  } catch (error) {
    return await localSimilaritySearch(queryEmbedding, limit);
  }
}

function buildUserContext(sources) {
  if (!Array.isArray(sources) || sources.length === 0) {
    return "No users were retrieved from the database.";
  }

  return sources
    .map((user, index) => {
      const score =
        typeof user.score === "number" ? `, similarityScore: ${user.score}` : "";

      return [
        `User ${index + 1}`,
        `id: ${user._id}`,
        `username: ${user.username}`,
        `email: ${user.email}`,
        `role: ${user.role}${score}`,
      ].join("\n");
    })
    .join("\n\n");
}

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

  try {
    ensureRequiredFields([
      { name: "username", value: username },
      { name: "email", value: email },
      { name: "password", value: password },
    ]);

    const userExists = await User.findOne({ email });
    if (userExists) {
      const err = new Error("Email is already in use");
      err.name = "ValidationError";
      err.status = 400;
      throw err;
    }

    const doc = await User.create({
      username,
      email,
      password,
      role: role || "user",
    });

    await syncEmbeddingForUser(doc);

    return res.status(201).json({ success: true, data: userResponse(doc) });
  } catch (err) {
    next(err);
  }
};

export const registerUser = async (req, res, next) => {
  req.body = { ...(req.body || {}), role: "user" };
  return createUser(req, res, next);
};

export const updateUser = async (req, res, next) => {
  const { username, email, password, role } = req.body || {};
  const updates = {};

  if (username) updates.username = username;
  if (email) updates.email = email;
  if (role) updates.role = role;

  try {
    if (password) {
      updates.password = await bcrypt.hash(password, 12);
    }

    if (Object.keys(updates).length === 0) {
      const err = new Error("At least one field is required to update");
      err.name = "ValidationError";
      err.status = 400;
      throw err;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select("+embedding");

    if (!user) {
      const err = new Error("User not found!");
      err.status = 404;
      throw err;
    }

    if (username || email || role) {
      user.embedding = await buildUserEmbedding(user);
      await user.save();
    }

    return res.status(200).json({ success: true, data: userResponse(user) });
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);

    if (!deleted) {
      const err = new Error("User not found!");
      err.status = 404;
      throw err;
    }

    return res.status(200).json({
      success: true,
      message: "Delete user successfully!",
      user: deleted,
    });
  } catch (err) {
    next(err);
  }
};

export const loginUser = async (req, res, next) => {
  const { email, password } = req.body || {};

  try {
    ensureRequiredFields([
      { name: "email", value: email },
      { name: "password", value: password },
    ]);

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      const err = new Error("Email or password is incorrect");
      err.status = 401;
      throw err;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const err = new Error("Email or password is incorrect");
      err.status = 401;
      throw err;
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const isProd = process.env.NODE_ENV === "production";

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      path: "/",
      maxAge: 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful!",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const askUsers = async (req, res, next) => {
  const { question, topK } = req.body || {};
  const trimmed = String(question || "").trim();

  try {
    if (!trimmed) {
      const err = new Error("question is required");
      err.name = "ValidationError";
      err.status = 400;
      throw err;
    }

    const parsedTopK = Number.isFinite(Number(topK)) ? Math.floor(Number(topK)) : 5;
    const limit = Math.min(Math.max(parsedTopK, 1), 20);

    const sources = await retrieveRelevantUsers(trimmed, limit);
    const context = buildUserContext(sources);
    const answer = await generateUserAnswer({
      question: trimmed,
      context,
    });

    return res.status(200).json({
      success: true,
      data: {
        answer,
        sources,
      },
    });
  } catch (error) {
    error.status = error.status || 500;
    error.name = error.name || "AiUsersError";
    error.message = error.message || "Failed to answer the users question";
    return next(error);
  }
};

export const reindexUserEmbeddings = async (req, res, next) => {
  try {
    const users = await User.find().select("+embedding");
    const updatedUsers = [];

    for (const user of users) {
      await syncEmbeddingForUser(user);
      updatedUsers.push({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Reindexed embeddings for ${updatedUsers.length} users`,
      data: updatedUsers,
    });
  } catch (error) {
    next(error);
  }
};

import { Router } from "express";
import { router as userRoutes } from "./users.routes.js";

export const router = Router();

router.use("/users", userRoutes);

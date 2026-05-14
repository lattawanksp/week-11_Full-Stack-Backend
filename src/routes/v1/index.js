import { Router } from "express";
import { router as userRoutes } from "./users.routes.js";
import { router as productsRoutes } from "./products.routes.js";
import { router as notesRoutes } from "./notes.routes.js";

export const router = Router();

router.use("/users", userRoutes);
router.use("/products", productsRoutes);
router.use("/notes", notesRoutes);

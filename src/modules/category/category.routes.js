import { Router } from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import authorizeRoles from "../../middleware/authorizeRoles.js";
import { uploadMiddleware } from "../../middleware/uploadMiddleware.js";
import {
  createCategoryController,
  deleteCategoryController,
  getAllCategoriesController,
  updateCategoryController
} from "./category.controller.js";

const router = Router();

router.get("/", getAllCategoriesController);
router.post(
  "/",
  authMiddleware,
  authorizeRoles("admin"),
  uploadMiddleware.single("icon"),
  createCategoryController
);
router.patch(
  "/:categoryId",
  authMiddleware,
  authorizeRoles("admin"),
  uploadMiddleware.single("icon"),
  updateCategoryController
);
router.delete(
  "/:categoryId",
  authMiddleware,
  authorizeRoles("admin"),
  deleteCategoryController
);

export default router;

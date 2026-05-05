import asyncHandler from "../../helpers/asyncHandler.js";
import { sendSuccess } from "../../helpers/apiResponse.js";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  updateCategory
} from "./category.service.js";
import { validateCategoryInput } from "./category.validation.js";

export const createCategoryController = asyncHandler(async (req, res) => {
  validateCategoryInput(req.body);
  const category = await createCategory(req.body, req.file);
  return sendSuccess(res, "Category created successfully.", { category }, 201);
});

export const updateCategoryController = asyncHandler(async (req, res) => {
  const category = await updateCategory(req.params.categoryId, req.body, req.file);
  return sendSuccess(res, "Category updated successfully.", { category });
});

export const getAllCategoriesController = asyncHandler(async (_req, res) => {
  const categories = await getAllCategories();
  return sendSuccess(res, "Categories fetched successfully.", { categories });
});

export const deleteCategoryController = asyncHandler(async (req, res) => {
  await deleteCategory(req.params.categoryId);
  return sendSuccess(res, "Category deleted successfully.");
});

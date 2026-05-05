import mongoose from "mongoose";
import AppError from "../../helpers/appError.js";
import Category from "../../models/category.model.js";
import Service from "../../models/service.model.js";

export const createCategory = async (payload, file) => {
  const categoryName = payload.categoryName?.trim();
  const existingCategory = await Category.findOne({ categoryName });

  if (existingCategory) {
    throw new AppError("Category already exists.", 409);
  }

  return Category.create({
    categoryName,
    icon: file?.location || ""
  });
};

export const updateCategory = async (categoryId, payload, file) => {
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new AppError("Invalid category id.");
  }

  const category = await Category.findById(categoryId);

  if (!category) {
    throw new AppError("Category not found.", 404);
  }

  if (payload.categoryName) {
    category.categoryName = payload.categoryName.trim();
  }

  if (file?.location) {
    category.icon = file.location;
  }

  await category.save();

  return category;
};

export const getAllCategories = async () => {
  return Category.find().sort({ createdAt: -1 });
};

export const deleteCategory = async (categoryId) => {
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new AppError("Invalid category id.");
  }

  const category = await Category.findById(categoryId);

  if (!category) {
    throw new AppError("Category not found.", 404);
  }

  const linkedService = await Service.findOne({ categoryId });

  if (linkedService) {
    throw new AppError("Cannot delete category because services are linked to it.", 400);
  }

  await Category.findByIdAndDelete(categoryId);
};

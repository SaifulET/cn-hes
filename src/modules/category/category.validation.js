import AppError from "../../helpers/appError.js";

export const validateCategoryInput = ({ categoryName }) => {
  if (!categoryName) {
    throw new AppError("categoryName is required.");
  }
};

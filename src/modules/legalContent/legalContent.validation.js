import AppError from "../../helpers/appError.js";
import { LEGAL_CONTENT_TYPES } from "../../models/legalContent.model.js";

export const validateCreateLegalContentInput = ({ type, title, content }) => {
  if (!type) {
    throw new AppError("type is required.");
  }

  if (!LEGAL_CONTENT_TYPES.includes(type)) {
    throw new AppError(
      `type must be one of: ${LEGAL_CONTENT_TYPES.join(", ")}.`
    );
  }

  if (!title) {
    throw new AppError("title is required.");
  }

  if (!content) {
    throw new AppError("content is required.");
  }
};

export const validateUpdateLegalContentInput = ({ title, content }) => {
  if (!title && !content) {
    throw new AppError("At least one of title or content is required.");
  }
};

export const validateLegalContentType = (type) => {
  if (!LEGAL_CONTENT_TYPES.includes(type)) {
    throw new AppError(
      `type must be one of: ${LEGAL_CONTENT_TYPES.join(", ")}.`
    );
  }
};

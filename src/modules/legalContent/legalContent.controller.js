import asyncHandler from "../../helpers/asyncHandler.js";
import { sendSuccess } from "../../helpers/apiResponse.js";
import {
  createLegalContent,
  getLegalContentByType,
  updateLegalContent
} from "./legalContent.service.js";
import {
  validateCreateLegalContentInput,
  validateLegalContentType,
  validateUpdateLegalContentInput
} from "./legalContent.validation.js";

export const createLegalContentController = asyncHandler(async (req, res) => {
  validateCreateLegalContentInput(req.body);
  const legalContent = await createLegalContent(req.body);

  return sendSuccess(
    res,
    "Legal content created successfully.",
    { legalContent },
    201
  );
});

export const updateLegalContentController = asyncHandler(async (req, res) => {
  validateLegalContentType(req.params.type);
  validateUpdateLegalContentInput(req.body);
  const legalContent = await updateLegalContent(req.params.type, req.body);

  return sendSuccess(res, "Legal content updated successfully.", {
    legalContent
  });
});

export const getLegalContentController = asyncHandler(async (req, res) => {
  validateLegalContentType(req.params.type);
  const legalContent = await getLegalContentByType(req.params.type);

  return sendSuccess(res, "Legal content fetched successfully.", {
    legalContent
  });
});

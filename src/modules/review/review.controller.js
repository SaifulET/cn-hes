import asyncHandler from "../../helpers/asyncHandler.js";
import { sendSuccess } from "../../helpers/apiResponse.js";
import {
  createOrUpdateReview,
  getReviewsByProviderId,
  getReviewsByServiceId
} from "./review.service.js";
import { validateReviewInput } from "./review.validation.js";

export const createReview = asyncHandler(async (req, res) => {
  validateReviewInput(req.body);
  const result = await createOrUpdateReview(req.user, req.params.serviceId, req.body);
  return sendSuccess(res, "Review submitted successfully.", result, 201);
});

export const getServiceReviews = asyncHandler(async (req, res) => {
  const result = await getReviewsByServiceId(req.params.serviceId);
  return sendSuccess(res, "Service reviews fetched successfully.", result);
});

export const getProviderReviews = asyncHandler(async (req, res) => {
  const result = await getReviewsByProviderId(req.params.providerId);
  return sendSuccess(res, "Provider reviews fetched successfully.", result);
});

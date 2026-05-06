import asyncHandler from "../../helpers/asyncHandler.js";
import { sendSuccess } from "../../helpers/apiResponse.js";
import {
  confirmBookingPayment,
  createBookingPayment,
  getBookingPaymentDetails
} from "./payment.service.js";
import {
  validateConfirmPaymentInput,
  validateCreatePaymentInput,
  validatePaymentBookingId
} from "./payment.validation.js";

export const createBookingPaymentController = asyncHandler(async (req, res) => {
  validateCreatePaymentInput(req.body);
  const result = await createBookingPayment(req.user, req.body);
  return sendSuccess(res, "Payment intent created successfully.", result, 201);
});

export const confirmBookingPaymentController = asyncHandler(async (req, res) => {
  validateConfirmPaymentInput(req.body);
  const result = await confirmBookingPayment(req.user._id, req.body);
  return sendSuccess(res, "Payment status fetched successfully.", result);
});

export const getBookingPaymentDetailsController = asyncHandler(async (req, res) => {
  validatePaymentBookingId(req.params.bookingId);
  const result = await getBookingPaymentDetails(req.user._id, req.params.bookingId);
  return sendSuccess(res, "Payment details fetched successfully.", result);
});

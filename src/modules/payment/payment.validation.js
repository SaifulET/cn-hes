import mongoose from "mongoose";
import AppError from "../../helpers/appError.js";

const ensureValidBookingId = (bookingId) => {
  if (!bookingId) {
    throw new AppError("bookingId is required.");
  }

  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    throw new AppError("Invalid booking id.");
  }
};

export const validateCreatePaymentInput = ({ bookingId, paymentMethodId }) => {
  ensureValidBookingId(bookingId);

  if (!paymentMethodId) {
    throw new AppError("paymentMethodId is required.");
  }
};

export const validateConfirmPaymentInput = ({ bookingId, paymentIntentId }) => {
  ensureValidBookingId(bookingId);

  if (!paymentIntentId) {
    throw new AppError("paymentIntentId is required.");
  }
};

export const validatePaymentBookingId = (bookingId) => {
  ensureValidBookingId(bookingId);
};

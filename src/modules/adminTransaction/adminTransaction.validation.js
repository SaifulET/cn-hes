import mongoose from "mongoose";
import AppError from "../../helpers/appError.js";

const paymentStatuses = ["unpaid", "processing", "requires_action", "succeeded", "failed"];

export const validateAdminTransactionQuery = ({
  page,
  limit,
  paymentStatus,
  date
}) => {
  if (page !== undefined && (!Number.isInteger(Number(page)) || Number(page) <= 0)) {
    throw new AppError("page must be a positive integer.");
  }

  if (limit !== undefined && (!Number.isInteger(Number(limit)) || Number(limit) <= 0)) {
    throw new AppError("limit must be a positive integer.");
  }

  if (paymentStatus && !paymentStatuses.includes(paymentStatus)) {
    throw new AppError(
      "paymentStatus must be unpaid, processing, requires_action, succeeded, or failed."
    );
  }

  if (date && Number.isNaN(new Date(date).getTime())) {
    throw new AppError("date must be a valid date string.");
  }
};

export const validateAdminTransactionId = (transactionId) => {
  if (!mongoose.Types.ObjectId.isValid(transactionId)) {
    throw new AppError("Invalid transaction id.");
  }
};

export const validateAdminAnalyticsYear = (year) => {
  if (
    year !== undefined &&
    (!Number.isInteger(Number(year)) || Number(year) < 2000 || Number(year) > 3000)
  ) {
    throw new AppError("year must be a valid 4 digit year.");
  }
};

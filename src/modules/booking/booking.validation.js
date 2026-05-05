import AppError from "../../helpers/appError.js";

const bookingStatuses = ["pending", "completed", "cancel"];

export const validateCreateBookingInput = ({ userId, serviceId, serviceName, serviceDetails, price }) => {
  if (!userId || !serviceId || !serviceName || !serviceDetails || price === undefined) {
    throw new AppError(
      "userId, serviceId, serviceName, serviceDetails and price are required."
    );
  }

  if (Number.isNaN(Number(price)) || Number(price) < 0) {
    throw new AppError("price must be a valid positive number or zero.");
  }
};

export const validateBookingStatus = (status) => {
  if (status && !bookingStatuses.includes(status)) {
    throw new AppError("status must be pending, completed, or cancel.");
  }
};

export const validateUserBookingAction = (status) => {
  if (!["completed", "cancel"].includes(status)) {
    throw new AppError("User can only update booking status to completed or cancel.");
  }
};

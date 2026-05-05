import asyncHandler from "../../helpers/asyncHandler.js";
import { sendSuccess } from "../../helpers/apiResponse.js";
import {
  createBookingRequest,
  getBookingDetails,
  getProviderBookingsByStatus,
  getUserBookingsByStatus,
  updateBookingStatusByUser
} from "./booking.service.js";
import {
  validateBookingStatus,
  validateCreateBookingInput,
  validateUserBookingAction
} from "./booking.validation.js";

export const createBookingController = asyncHandler(async (req, res) => {
  validateCreateBookingInput(req.body);
  const booking = await createBookingRequest(req.user._id, req.body);
  return sendSuccess(res, "Booking request sent successfully.", { booking }, 201);
});

export const getProviderBookingsController = asyncHandler(async (req, res) => {
  validateBookingStatus(req.query.status);
  const bookings = await getProviderBookingsByStatus(req.user._id, req.query.status);
  return sendSuccess(res, "Provider bookings fetched successfully.", { bookings });
});

export const getUserBookingsController = asyncHandler(async (req, res) => {
  validateBookingStatus(req.query.status);
  const bookings = await getUserBookingsByStatus(req.user._id, req.query.status);
  return sendSuccess(res, "User bookings fetched successfully.", { bookings });
});

export const updateBookingStatusByUserController = asyncHandler(async (req, res) => {
  validateUserBookingAction(req.body.status);
  const booking = await updateBookingStatusByUser(req.user._id, req.params.bookingId, req.body.status);
  return sendSuccess(res, "Booking status updated successfully.", { booking });
});

export const getBookingDetailsController = asyncHandler(async (req, res) => {
  const booking = await getBookingDetails(req.params.bookingId, req.user._id, req.user.role);
  return sendSuccess(res, "Booking details fetched successfully.", { booking });
});

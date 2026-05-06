import mongoose from "mongoose";
import AppError from "../../helpers/appError.js";
import Booking from "../../models/booking.model.js";
import Service from "../../models/service.model.js";
import User from "../../models/user.model.js";
import { createNotification } from "../notification/notification.service.js";

const bookingPopulate = [
  {
    path: "providerId",
    select: "name email phone profileImage role"
  },
  {
    path: "userId",
    select: "name email phone profileImage role"
  },
  {
    path: "serviceId",
    select: "serviceName serviceImg address"
  }
];

const ensureValidId = (value, label) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new AppError(`Invalid ${label}.`);
  }
};

export const createBookingRequest = async (providerId, payload) => {
  ensureValidId(payload.userId, "user id");
  ensureValidId(payload.serviceId, "service id");

  const [user, service] = await Promise.all([
    User.findById(payload.userId),
    Service.findById(payload.serviceId)
  ]);

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  if (!service) {
    throw new AppError("Service not found.", 404);
  }

  if (service.providerId.toString() !== providerId.toString()) {
    throw new AppError("You can only create booking requests for your own services.", 403);
  }

  const booking = await Booking.create({
    providerId,
    userId: payload.userId,
    serviceId: payload.serviceId,
    serviceName: payload.serviceName,
    serviceDetails: payload.serviceDetails,
    price: Number(payload.price),
    status: "pending"
  });

  await booking.populate(bookingPopulate);
  await createNotification({
    recipientId: booking.userId._id,
    recipientRole: "user",
    type: "booking_request",
    title: "New booking request",
    message: `${booking.providerId.name} sent you a booking request for ${booking.serviceName}.`,
    metadata: {
      bookingId: booking._id,
      providerId: booking.providerId._id,
      serviceId: booking.serviceId._id || booking.serviceId
    }
  });

  return booking;
};

export const getProviderBookingsByStatus = async (providerId, status) => {
  const query = { providerId };

  if (status) {
    query.status = status;
  }

  return Booking.find(query).populate(bookingPopulate).sort({ createdAt: -1 });
};

export const getUserBookingsByStatus = async (userId, status) => {
  const query = { userId };

  if (status) {
    query.status = status;
  }

  return Booking.find(query).populate(bookingPopulate).sort({ createdAt: -1 });
};

export const updateBookingStatusByUser = async (userId, bookingId, status) => {
  ensureValidId(bookingId, "booking id");

  const booking = await Booking.findOne({ _id: bookingId, userId });

  if (!booking) {
    throw new AppError("Booking not found for this user.", 404);
  }

  if (booking.status !== "pending") {
    throw new AppError("Only pending bookings can be updated by the user.");
  }

  booking.status = status;
  await booking.save();
  await booking.populate(bookingPopulate);
  if (status === "completed") {
    await createNotification({
      recipientId: booking.providerId._id,
      recipientRole: "provider",
      type: "service_accepted_by_user",
      title: "Service accepted by user",
      message: `${booking.userId.name} accepted the service ${booking.serviceName}.`,
      metadata: {
        bookingId: booking._id,
        userId: booking.userId._id
      }
    });
  }

  return booking;
};

export const getBookingDetails = async (bookingId, requesterId, requesterRole) => {
  ensureValidId(bookingId, "booking id");

  const booking = await Booking.findById(bookingId).populate(bookingPopulate);

  if (!booking) {
    throw new AppError("Booking not found.", 404);
  }

  const isProviderOwner = booking.providerId?._id?.toString() === requesterId.toString();
  const isUserOwner = booking.userId?._id?.toString() === requesterId.toString();

  if (requesterRole !== "admin" && !isProviderOwner && !isUserOwner) {
    throw new AppError("You are not allowed to view this booking.", 403);
  }

  return booking;
};

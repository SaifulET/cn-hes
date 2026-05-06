import Stripe from "stripe";
import AppError from "../../helpers/appError.js";
import { env } from "../../config/env.js";
import Booking from "../../models/booking.model.js";
import Payment from "../../models/payment.model.js";

const stripe = env.stripeSecretKey
  ? new Stripe(env.stripeSecretKey)
  : null;

const bookingPaymentPopulate = [
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

const paymentPopulate = [
  {
    path: "bookingId",
    populate: bookingPaymentPopulate
  },
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

const ensureStripeConfigured = () => {
  if (!stripe) {
    throw new AppError("Stripe is not configured on the server.", 500);
  }
};

const ensureBookingPayableByUser = async (bookingId, userId) => {
  const booking = await Booking.findOne({ _id: bookingId, userId }).populate(
    bookingPaymentPopulate
  );

  if (!booking) {
    throw new AppError("Booking not found for this user.", 404);
  }

  return booking;
};

const mapStripeStatusToPaymentStatus = (status) => {
  switch (status) {
    case "succeeded":
      return "succeeded";
    case "requires_action":
    case "requires_confirmation":
    case "requires_payment_method":
      return "requires_action";
    case "processing":
      return "processing";
    case "canceled":
      return "failed";
    default:
      return "failed";
  }
};

const syncBookingStatusWithPayment = (booking, payment, stripeStatus) => {
  if (stripeStatus === "succeeded") {
    booking.status = "completed";
    payment.paymentStatus = "succeeded";
    payment.paymentDate = new Date();
    return;
  }

  payment.paymentStatus = mapStripeStatusToPaymentStatus(stripeStatus);

  if (payment.paymentStatus !== "succeeded") {
    payment.paymentDate = null;
  }
};

const findOrCreatePaymentForBooking = async (booking) => {
  let payment = await Payment.findOne({ bookingId: booking._id });

  if (!payment) {
    payment = await Payment.create({
      bookingId: booking._id,
      serviceId: booking.serviceId._id || booking.serviceId,
      providerId: booking.providerId._id || booking.providerId,
      userId: booking.userId._id || booking.userId,
      amount: booking.price
    });
  }

  if (payment.paymentStatus === "succeeded") {
    throw new AppError("This booking is already paid.", 409);
  }

  return payment;
};

export const createBookingPayment = async (user, { bookingId, paymentMethodId }) => {
  ensureStripeConfigured();

  const booking = await ensureBookingPayableByUser(bookingId, user._id);
  const payment = await findOrCreatePaymentForBooking(booking);

  const amount = Math.round(Number(booking.price) * 100);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError("Invalid booking amount.");
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: env.stripeCurrency,
    payment_method: paymentMethodId,
    confirm: true,
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: "never"
    },
    metadata: {
      bookingId: booking._id.toString(),
      userId: booking.userId._id.toString(),
      providerId: booking.providerId._id.toString(),
      serviceId: booking.serviceId._id.toString()
    },
    receipt_email: user.email
  });

  payment.stripePaymentIntentId = paymentIntent.id;
  payment.stripeClientSecret = paymentIntent.client_secret || null;
  syncBookingStatusWithPayment(booking, payment, paymentIntent.status);
  await Promise.all([booking.save(), payment.save()]);
  await payment.populate(paymentPopulate);

  return {
    booking,
    payment: {
      id: payment._id,
      bookingId: payment.bookingId?._id || booking._id,
      serviceId: payment.serviceId?._id || booking.serviceId._id,
      providerId: payment.providerId?._id || booking.providerId._id,
      userId: payment.userId?._id || booking.userId._id,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: payment.amount,
      currency: paymentIntent.currency,
      status: payment.paymentStatus,
      paymentDate: payment.paymentDate
    }
  };
};

export const confirmBookingPayment = async (userId, { bookingId, paymentIntentId }) => {
  ensureStripeConfigured();

  const booking = await ensureBookingPayableByUser(bookingId, userId);
  const payment = await findOrCreatePaymentForBooking(booking);

  if (payment.stripePaymentIntentId && payment.stripePaymentIntentId !== paymentIntentId) {
    throw new AppError("Payment intent does not match this booking.", 400);
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.metadata?.bookingId !== booking._id.toString()) {
    throw new AppError("Payment intent does not belong to this booking.", 400);
  }

  payment.stripePaymentIntentId = paymentIntent.id;
  payment.stripeClientSecret = paymentIntent.client_secret || payment.stripeClientSecret;
  syncBookingStatusWithPayment(booking, payment, paymentIntent.status);
  await Promise.all([booking.save(), payment.save()]);
  await booking.populate(bookingPaymentPopulate);
  await payment.populate(paymentPopulate);

  return {
    booking,
    payment: {
      id: payment._id,
      bookingId: payment.bookingId?._id || booking._id,
      serviceId: payment.serviceId?._id || booking.serviceId._id,
      providerId: payment.providerId?._id || booking.providerId._id,
      userId: payment.userId?._id || booking.userId._id,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: payment.amount,
      currency: paymentIntent.currency,
      status: payment.paymentStatus,
      paymentDate: payment.paymentDate
    }
  };
};

export const getBookingPaymentDetails = async (userId, bookingId) => {
  const booking = await Booking.findOne({ _id: bookingId, userId }).populate(bookingPaymentPopulate);

  if (!booking) {
    throw new AppError("Booking not found for this user.", 404);
  }

  const payment = await Payment.findOne({ bookingId, userId }).populate(paymentPopulate);

  return {
    booking,
    payment: {
      id: payment?._id || null,
      bookingId: booking._id,
      serviceId: payment?.serviceId?._id || booking.serviceId._id,
      providerId: payment?.providerId?._id || booking.providerId._id,
      userId: payment?.userId?._id || booking.userId._id,
      amount: payment?.amount ?? booking.price,
      currency: env.stripeCurrency,
      paymentStatus: payment?.paymentStatus || "unpaid",
      paymentIntentId: payment?.stripePaymentIntentId || null,
      paymentDate: payment?.paymentDate || null
    }
  };
};

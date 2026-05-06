import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    paymentDate: {
      type: Date,
      default: null
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "processing", "requires_action", "succeeded", "failed"],
      default: "unpaid"
    },
    stripePaymentIntentId: {
      type: String,
      default: null
    },
    stripeClientSecret: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ providerId: 1, createdAt: -1 });
paymentSchema.index({ serviceId: 1, createdAt: -1 });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;

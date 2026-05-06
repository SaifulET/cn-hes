import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema(
  {
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    requestedBankName: {
      type: String,
      default: ""
    },
    requestedAccountType: {
      type: String,
      default: ""
    },
    requestedAccountHolderName: {
      type: String,
      default: ""
    },
    requestedAccountNumberMasked: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      enum: ["pending", "processing", "paid", "failed", "cancelled"],
      default: "pending"
    },
    transactionId: {
      type: String,
      default: ""
    },
    transactionImages: {
      type: [String],
      default: []
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    paidAt: {
      type: Date,
      default: null
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    stripeTransferId: {
      type: String,
      default: ""
    },
    stripePayoutId: {
      type: String,
      default: ""
    },
    stripeResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    destinationBankAccount: {
      bankName: {
        type: String,
        default: ""
      },
      accountHolderName: {
        type: String,
        default: ""
      },
      accountHolderType: {
        type: String,
        default: ""
      },
      last4: {
        type: String,
        default: ""
      },
      currency: {
        type: String,
        default: ""
      },
      country: {
        type: String,
        default: ""
      }
    }
  },
  {
    timestamps: true
  }
);

withdrawalSchema.index({ providerId: 1, createdAt: -1 });
withdrawalSchema.index({ status: 1, createdAt: -1 });

const Withdrawal = mongoose.model("Withdrawal", withdrawalSchema);

export default Withdrawal;

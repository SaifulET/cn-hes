import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { USER_ROLES } from "../constants/roles.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: "user"
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    profileImage: {
      type: String,
      default: ""
    },
    licenseFrontImage: {
      type: String,
      default: ""
    },
    licenseBackImage: {
      type: String,
      default: ""
    },
    address: {
      type: String,
      default: ""
    },
    verificationOtp: {
      type: String,
      default: null
    },
    verificationOtpExpiresAt: {
      type: Date,
      default: null
    },
    forgotPasswordOtp: {
      type: String,
      default: null
    },
    forgotPasswordOtpExpiresAt: {
      type: Date,
      default: null
    },
    forgotPasswordOtpVerified: {
      type: Boolean,
      default: false
    },
    refreshToken: {
      type: String,
      default: null
    },
    stripeAccountId: {
      type: String,
      default: ""
    },
    stripeAccountStatus: {
      type: String,
      enum: ["not_connected", "pending", "connected"],
      default: "not_connected"
    },
    stripeBankAccount: {
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

userSchema.pre("save", async function savePassword(next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;

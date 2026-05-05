import crypto from "crypto";
import { env } from "../config/env.js";

export const generateOtp = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

export const hashOtp = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

export const getOtpExpiryDate = () => {
  return new Date(Date.now() + env.otpExpiresInMinutes * 60 * 1000);
};

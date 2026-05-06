import User from "../../models/user.model.js";
import AppError from "../../helpers/appError.js";
import { generateOtp, getOtpExpiryDate, hashOtp } from "../../helpers/otpHelper.js";
import { buildOtpEmailTemplate, sendEmail } from "../../helpers/emailHelper.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from "../../helpers/tokenHelper.js";
import { sanitizeUser } from "../../helpers/userSanitizer.js";
import { env } from "../../config/env.js";
import { createNotificationsForRole } from "../notification/notification.service.js";

const buildAuthResponse = async (user) => {
  const payload = {
    userId: user._id.toString(),
    role: user.role,
    email: user.email
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  user.refreshToken = refreshToken;
  await user.save();

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken
  };
};

const sendVerificationOtpEmail = async (user, otp) => {
  const template = buildOtpEmailTemplate({
    title: "Verify Your CN-HES Account",
    greeting: `Hello ${user.name},`,
    intro:
      "Thank you for registering with CN-HES. Please use the one-time password below to verify your email address and activate your account.",
    otp,
    expiryMinutes: env.otpExpiresInMinutes,
    footerNote:
      "For your security, this code should only be used on the CN-HES verification screen."
  });

  await sendEmail({
    to: user.email,
    subject: "CN-HES Account Verification Code",
    html: template.html,
    text: template.text
  });
};

const sendForgotPasswordOtpEmail = async (user, otp) => {
  const template = buildOtpEmailTemplate({
    title: "Reset Your CN-HES Password",
    greeting: `Hello ${user.name},`,
    intro:
      "We received a request to reset your CN-HES account password. Please use the one-time password below to continue.",
    otp,
    expiryMinutes: env.otpExpiresInMinutes,
    footerNote:
      "If you did not request a password reset, we recommend ignoring this message and reviewing your account activity."
  });

  await sendEmail({
    to: user.email,
    subject: "CN-HES Password Reset Code",
    html: template.html,
    text: template.text
  });
};

export const signupUser = async (payload) => {
  const existingUser = await User.findOne({ email: payload.email.toLowerCase() });

  if (existingUser) {
    if (existingUser.isVerified) {
      throw new AppError("Email already exists.", 409);
    }

    const otp = generateOtp();

    existingUser.name = payload.name;
    existingUser.phone = payload.phone;
    existingUser.password = payload.password;
    existingUser.role = payload.role || existingUser.role || "user";
    existingUser.verificationOtp = hashOtp(otp);
    existingUser.verificationOtpExpiresAt = getOtpExpiryDate();
    await existingUser.save();

    await sendVerificationOtpEmail(existingUser, otp);

    return {
      user: sanitizeUser(existingUser)
    };
  }

  const otp = generateOtp();

  const user = await User.create({
    name: payload.name,
    email: payload.email.toLowerCase(),
    phone: payload.phone,
    password: payload.password,
    role: payload.role || "user",
    verificationOtp: hashOtp(otp),
    verificationOtpExpiresAt: getOtpExpiryDate()
  });

  await sendVerificationOtpEmail(user, otp);
  await createNotificationsForRole({
    role: "admin",
    type: user.role === "provider" ? "new_provider_added" : "new_user_added",
    title: user.role === "provider" ? "New provider added" : "New user added",
    message:
      user.role === "provider"
        ? `${user.name} has registered as a provider.`
        : `${user.name} has registered as a user.`,
    metadata: {
      userId: user._id,
      role: user.role
    }
  });

  return {
    user: sanitizeUser(user)
  };
};

export const verifySignupOtp = async ({ email, otp }) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  if (!user.verificationOtp || !user.verificationOtpExpiresAt) {
    throw new AppError("No verification OTP found for this account.");
  }

  if (user.verificationOtpExpiresAt < new Date()) {
    throw new AppError("Verification OTP has expired.");
  }

  if (user.verificationOtp !== hashOtp(otp)) {
    throw new AppError("Invalid verification OTP.");
  }

  user.isVerified = true;
  user.verificationOtp = null;
  user.verificationOtpExpiresAt = null;
  await user.save();

  return buildAuthResponse(user);
};

export const resendVerificationOtp = async ({ email }) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  if (user.isVerified) {
    throw new AppError("User is already verified.");
  }

  const otp = generateOtp();
  user.verificationOtp = hashOtp(otp);
  user.verificationOtpExpiresAt = getOtpExpiryDate();
  await user.save();

  await sendVerificationOtpEmail(user, otp);
};

export const signinUser = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    throw new AppError("Invalid email or password.", 401);
  }

  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    throw new AppError("Invalid email or password.", 401);
  }

  if (!user.isVerified) {
    throw new AppError("Please verify your account with OTP before signing in.", 403);
  }

  return buildAuthResponse(user);
};

export const forgotPassword = async ({ email }) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  const otp = generateOtp();
  user.forgotPasswordOtp = hashOtp(otp);
  user.forgotPasswordOtpExpiresAt = getOtpExpiryDate();
  user.forgotPasswordOtpVerified = false;
  await user.save();

  await sendForgotPasswordOtpEmail(user, otp);
};

export const verifyForgotPasswordOtp = async ({ email, otp }) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  if (!user.forgotPasswordOtp || !user.forgotPasswordOtpExpiresAt) {
    throw new AppError("No forgot password OTP found.");
  }

  if (user.forgotPasswordOtpExpiresAt < new Date()) {
    throw new AppError("Forgot password OTP has expired.");
  }

  if (user.forgotPasswordOtp !== hashOtp(otp)) {
    throw new AppError("Invalid forgot password OTP.");
  }

  user.forgotPasswordOtpVerified = true;
  await user.save();
};

export const resetPassword = async ({ email, newPassword }) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  if (!user.forgotPasswordOtpVerified) {
    throw new AppError("Please verify your forgot password OTP first.");
  }

  user.password = newPassword;
  user.forgotPasswordOtp = null;
  user.forgotPasswordOtpExpiresAt = null;
  user.forgotPasswordOtpVerified = false;
  user.refreshToken = null;
  await user.save();
};

export const changePassword = async (userId, { oldPassword, newPassword }) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  const isOldPasswordMatched = await user.comparePassword(oldPassword);

  if (!isOldPasswordMatched) {
    throw new AppError("Old password is incorrect.", 401);
  }

  user.password = newPassword;
  user.refreshToken = null;
  await user.save();
};

export const refreshAccessToken = async ({ refreshToken }) => {
  if (!refreshToken) {
    throw new AppError("Refresh token is required.", 401);
  }

  const decoded = verifyRefreshToken(refreshToken);
  const user = await User.findById(decoded.userId);

  if (!user || user.refreshToken !== refreshToken) {
    throw new AppError("Invalid refresh token.", 401);
  }

  return buildAuthResponse(user);
};

export const logoutUser = async (user) => {
  user.refreshToken = null;
  await user.save();
};

export const updateProfile = async (userId, payload, files) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  if (payload.name) {
    user.name = payload.name;
  }

  if (payload.phone) {
    user.phone = payload.phone;
  }

  if (payload.address) {
    user.address = payload.address;
  }

  if (files?.profileImage?.[0]?.location) {
    user.profileImage = files.profileImage[0].location;
  }

  if (files?.licenseFrontImage?.[0]?.location) {
    user.licenseFrontImage = files.licenseFrontImage[0].location;
  }

  if (files?.licenseBackImage?.[0]?.location) {
    user.licenseBackImage = files.licenseBackImage[0].location;
  }

  await user.save();

  return sanitizeUser(user);
};

export const getMyProfile = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  return sanitizeUser(user);
};

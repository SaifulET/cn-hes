import asyncHandler from "../../helpers/asyncHandler.js";
import { sendSuccess } from "../../helpers/apiResponse.js";
import {
  changePassword,
  forgotPassword,
  getMyProfile,
  logoutUser,
  refreshAccessToken,
  resendVerificationOtp,
  resetPassword,
  signinUser,
  signupUser,
  updateProfile,
  verifyForgotPasswordOtp,
  verifySignupOtp
} from "./auth.service.js";
import {
  validateChangePasswordInput,
  validateEmailOtpInput,
  validatePasswordReset,
  validateSigninInput,
  validateSignupInput
} from "./auth.validation.js";

export const signup = asyncHandler(async (req, res) => {
  validateSignupInput(req.body);
  const result = await signupUser(req.body);

  return sendSuccess(
    res,
    "Signup successful. Please verify your account with the OTP sent to your email.",
    result,
    201
  );
});

export const verifyOtp = asyncHandler(async (req, res) => {
  validateEmailOtpInput(req.body);
  const result = await verifySignupOtp(req.body);
  return sendSuccess(res, "Account verified successfully.", result);
});

export const resendOtp = asyncHandler(async (req, res) => {
  await resendVerificationOtp(req.body);
  return sendSuccess(res, "Verification OTP sent successfully.");
});

export const signin = asyncHandler(async (req, res) => {
  validateSigninInput(req.body);
  const result = await signinUser(req.body);
  return sendSuccess(res, "Signin successful.", result);
});

export const forgotPasswordController = asyncHandler(async (req, res) => {
  await forgotPassword(req.body);
  return sendSuccess(res, "Forgot password OTP sent successfully.");
});

export const verifyForgotPasswordOtpController = asyncHandler(async (req, res) => {
  validateEmailOtpInput(req.body);
  await verifyForgotPasswordOtp(req.body);
  return sendSuccess(res, "Forgot password OTP verified successfully.");
});

export const resetPasswordController = asyncHandler(async (req, res) => {
  validatePasswordReset(req.body);
  await resetPassword(req.body);
  return sendSuccess(res, "Password reset successful.");
});

export const changePasswordController = asyncHandler(async (req, res) => {
  validateChangePasswordInput(req.body);
  await changePassword(req.user._id, req.body);
  return sendSuccess(res, "Password changed successfully.");
});

export const refreshTokenController = asyncHandler(async (req, res) => {
  const result = await refreshAccessToken(req.body);
  return sendSuccess(res, "Access token refreshed successfully.", result);
});

export const logout = asyncHandler(async (req, res) => {
  await logoutUser(req.user);
  return sendSuccess(res, "Logout successful.");
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const profile = await updateProfile(req.user._id, req.body, req.files);
  return sendSuccess(res, "Profile updated successfully.", { user: profile });
});

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await getMyProfile(req.user._id);
  return sendSuccess(res, "Profile fetched successfully.", { user: profile });
});

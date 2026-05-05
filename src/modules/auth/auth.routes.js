import { Router } from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import { uploadMiddleware } from "../../middleware/uploadMiddleware.js";
import {
  forgotPasswordController,
  getProfile,
  logout,
  refreshTokenController,
  resendOtp,
  resetPasswordController,
  signin,
  signup,
  updateMyProfile,
  verifyForgotPasswordOtpController,
  verifyOtp
} from "./auth.controller.js";

const router = Router();

router.post("/signup", signup);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/signin", signin);
router.post("/forgot-password", forgotPasswordController);
router.post("/verify-forgot-password-otp", verifyForgotPasswordOtpController);
router.post("/reset-password", resetPasswordController);
router.post("/refresh-token", refreshTokenController);
router.post("/logout", authMiddleware, logout);
router.get("/me", authMiddleware, getProfile);
router.patch(
  "/me",
  authMiddleware,
  uploadMiddleware.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "licenseFrontImage", maxCount: 1 },
    { name: "licenseBackImage", maxCount: 1 }
  ]),
  updateMyProfile
);

export default router;

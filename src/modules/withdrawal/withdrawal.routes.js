import { Router } from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import authorizeRoles from "../../middleware/authorizeRoles.js";
import { uploadMiddleware } from "../../middleware/uploadMiddleware.js";
import {
  approveWithdrawalRequestController,
  cancelWithdrawalRequestController,
  createConnectedAccountController,
  createOnboardingLinkController,
  createWithdrawalRequestController,
  getAllWithdrawalsController,
  getConnectedAccountStatusController,
  getMyWithdrawalsController,
  getWithdrawalDetailsController,
  getWithdrawalEligibilityController
} from "./withdrawal.controller.js";

const router = Router();

router.use(authMiddleware);

router.get(
  "/eligibility",
  authorizeRoles("provider"),
  getWithdrawalEligibilityController
);
router.post(
  "/connect-account",
  authorizeRoles("provider"),
  createConnectedAccountController
);
router.post(
  "/connect-account/onboarding-link",
  authorizeRoles("provider"),
  createOnboardingLinkController
);
router.get(
  "/connect-account/status",
  authorizeRoles("provider"),
  getConnectedAccountStatusController
);
router.post("/", authorizeRoles("provider"), createWithdrawalRequestController);
router.get("/my", authorizeRoles("provider"), getMyWithdrawalsController);
router.get("/admin", authorizeRoles("admin"), getAllWithdrawalsController);
router.get("/:withdrawalId", getWithdrawalDetailsController);
router.patch(
  "/:withdrawalId/approve",
  authorizeRoles("admin"),
  uploadMiddleware.fields([{ name: "transactionImages", maxCount: 5 }]),
  approveWithdrawalRequestController
);
router.patch(
  "/:withdrawalId/cancel",
  authorizeRoles("admin"),
  cancelWithdrawalRequestController
);

export default router;

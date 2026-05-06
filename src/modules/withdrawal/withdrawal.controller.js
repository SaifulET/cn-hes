import asyncHandler from "../../helpers/asyncHandler.js";
import { sendSuccess } from "../../helpers/apiResponse.js";
import {
  approveWithdrawalRequest,
  cancelWithdrawalRequest,
  createOrGetStripeConnectedAccount,
  createStripeOnboardingLink,
  createWithdrawalRequest,
  getAllWithdrawals,
  getConnectedAccountStatus,
  getMyWithdrawals,
  getProviderWithdrawalEligibility,
  getWithdrawalDetails,
  handleStripeWithdrawalWebhook
} from "./withdrawal.service.js";
import {
  validateApproveWithdrawalInput,
  validateConnectAccountInput,
  validateCreateWithdrawalInput,
  validateConnectedAccountStatus,
  validateWithdrawalStatus
} from "./withdrawal.validation.js";

export const createConnectedAccountController = asyncHandler(async (req, res) => {
  validateConnectAccountInput(req.body);
  const result = await createOrGetStripeConnectedAccount(req.user, req.body);
  return sendSuccess(res, "Stripe connected account prepared successfully.", result);
});

export const createOnboardingLinkController = asyncHandler(async (req, res) => {
  const result = await createStripeOnboardingLink(req.user._id);
  return sendSuccess(res, "Stripe onboarding link created successfully.", result);
});

export const getConnectedAccountStatusController = asyncHandler(async (req, res) => {
  validateConnectedAccountStatus(req.query.status);
  const result = await getConnectedAccountStatus(req.user._id);
  return sendSuccess(
    res,
    "Stripe connected account status fetched successfully.",
    result
  );
});

export const getWithdrawalEligibilityController = asyncHandler(async (req, res) => {
  const summary = await getProviderWithdrawalEligibility(req.user._id);
  return sendSuccess(res, "Withdrawal eligibility fetched successfully.", {
    summary
  });
});

export const createWithdrawalRequestController = asyncHandler(async (req, res) => {
  validateCreateWithdrawalInput(req.body);
  const result = await createWithdrawalRequest(req.user._id, req.body);
  return sendSuccess(res, "Withdrawal request created successfully.", result, 201);
});

export const getMyWithdrawalsController = asyncHandler(async (req, res) => {
  validateWithdrawalStatus(req.query.status);
  const withdrawals = await getMyWithdrawals(req.user._id, req.query.status);
  return sendSuccess(res, "Withdrawals fetched successfully.", { withdrawals });
});

export const getAllWithdrawalsController = asyncHandler(async (req, res) => {
  validateWithdrawalStatus(req.query.status);
  const withdrawals = await getAllWithdrawals(req.query.status);
  return sendSuccess(res, "All withdrawals fetched successfully.", { withdrawals });
});

export const getWithdrawalDetailsController = asyncHandler(async (req, res) => {
  const withdrawal = await getWithdrawalDetails(req.user, req.params.withdrawalId);
  return sendSuccess(res, "Withdrawal details fetched successfully.", {
    withdrawal
  });
});

export const approveWithdrawalRequestController = asyncHandler(async (req, res) => {
  validateApproveWithdrawalInput(req.body);
  const withdrawal = await approveWithdrawalRequest(
    req.user._id,
    req.params.withdrawalId,
    req.body,
    req.files
  );
  return sendSuccess(res, "Withdrawal request approved successfully.", {
    withdrawal
  });
});

export const cancelWithdrawalRequestController = asyncHandler(async (req, res) => {
  const withdrawal = await cancelWithdrawalRequest(req.params.withdrawalId);
  return sendSuccess(res, "Withdrawal request cancelled successfully.", {
    withdrawal
  });
});

export const stripeWithdrawalWebhookController = async (req, res, next) => {
  try {
    const result = await handleStripeWithdrawalWebhook(
      req.body,
      req.headers["stripe-signature"]
    );

    return res.status(200).json({
      received: true,
      type: result.type
    });
  } catch (error) {
    return next(error);
  }
};

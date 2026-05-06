import asyncHandler from "../../helpers/asyncHandler.js";
import { sendSuccess } from "../../helpers/apiResponse.js";
import {
  getAdminDashboardOverview,
  getAdminEarningsChart,
  getAdminTransactionDashboard,
  getAdminTransactionDetails,
  getAdminTransactions
} from "./adminTransaction.service.js";
import {
  validateAdminAnalyticsYear,
  validateAdminTransactionId,
  validateAdminTransactionQuery
} from "./adminTransaction.validation.js";

export const getAdminTransactionDashboardController = asyncHandler(async (_req, res) => {
  const dashboard = await getAdminTransactionDashboard();
  return sendSuccess(res, "Admin transaction dashboard fetched successfully.", {
    dashboard
  });
});

export const getAdminTransactionsController = asyncHandler(async (req, res) => {
  validateAdminTransactionQuery(req.query);
  const result = await getAdminTransactions(req.query);
  return sendSuccess(res, "Admin transactions fetched successfully.", result);
});

export const getAdminDashboardOverviewController = asyncHandler(async (_req, res) => {
  const overview = await getAdminDashboardOverview();
  return sendSuccess(res, "Admin dashboard overview fetched successfully.", {
    overview
  });
});

export const getAdminEarningsChartController = asyncHandler(async (req, res) => {
  validateAdminAnalyticsYear(req.query.year);
  const earningsChart = await getAdminEarningsChart(req.query.year);
  return sendSuccess(res, "Admin earnings chart fetched successfully.", {
    earningsChart
  });
});

export const getAdminTransactionDetailsController = asyncHandler(async (req, res) => {
  validateAdminTransactionId(req.params.transactionId);
  const transaction = await getAdminTransactionDetails(req.params.transactionId);
  return sendSuccess(res, "Admin transaction details fetched successfully.", {
    transaction
  });
});

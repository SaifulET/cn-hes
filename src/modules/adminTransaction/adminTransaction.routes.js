import { Router } from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import authorizeRoles from "../../middleware/authorizeRoles.js";
import {
  getAdminDashboardOverviewController,
  getAdminEarningsChartController,
  getAdminTransactionDashboardController,
  getAdminTransactionDetailsController,
  getAdminTransactionsController
} from "./adminTransaction.controller.js";

const router = Router();

router.use(authMiddleware);
router.use(authorizeRoles("admin"));

router.get("/overview", getAdminDashboardOverviewController);
router.get("/earnings-chart", getAdminEarningsChartController);
router.get("/dashboard", getAdminTransactionDashboardController);
router.get("/", getAdminTransactionsController);
router.get("/:transactionId", getAdminTransactionDetailsController);

export default router;

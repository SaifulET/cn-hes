import { Router } from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import authorizeRoles from "../../middleware/authorizeRoles.js";
import {
  confirmBookingPaymentController,
  createBookingPaymentController,
  getBookingPaymentDetailsController
} from "./payment.controller.js";

const router = Router();

router.use(authMiddleware);
router.use(authorizeRoles("user"));

router.post("/create-intent", createBookingPaymentController);
router.post("/confirm", confirmBookingPaymentController);
router.get("/booking/:bookingId", getBookingPaymentDetailsController);

export default router;

import { Router } from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import authorizeRoles from "../../middleware/authorizeRoles.js";
import {
  createBookingController,
  getBookingDetailsController,
  getProviderBookingsController,
  getUserBookingsController,
  updateBookingStatusByUserController
} from "./booking.controller.js";

const router = Router();

router.use(authMiddleware);

router.post("/", authorizeRoles("provider", "admin"), createBookingController);
router.get("/provider", authorizeRoles("provider", "admin"), getProviderBookingsController);
router.get("/user", authorizeRoles("user", "admin"), getUserBookingsController);
router.get("/:bookingId", getBookingDetailsController);
router.patch("/:bookingId/status", authorizeRoles("user", "admin"), updateBookingStatusByUserController);

export default router;

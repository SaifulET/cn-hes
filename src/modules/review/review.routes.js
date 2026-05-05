import { Router } from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import authorizeRoles from "../../middleware/authorizeRoles.js";
import {
  createReview,
  getProviderReviews,
  getServiceReviews
} from "./review.controller.js";

const router = Router();

router.get("/service/:serviceId", getServiceReviews);
router.get("/provider/:providerId", getProviderReviews);
router.post(
  "/service/:serviceId",
  authMiddleware,
  authorizeRoles("user", "provider", "admin"),
  createReview
);

export default router;

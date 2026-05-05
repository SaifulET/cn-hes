import { Router } from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import authorizeRoles from "../../middleware/authorizeRoles.js";
import { uploadMiddleware } from "../../middleware/uploadMiddleware.js";
import {
  createService,
  getAllProviderServices,
  getServicesByCategory,
  getAllServices,
  getServiceDetails,
  searchServicesByKeyword,
  updateService
} from "./service.controller.js";

const router = Router();

router.get("/", getAllServices);
router.get("/search", searchServicesByKeyword);
router.get("/category/:categoryId", getServicesByCategory);
router.get("/provider/:providerId", getAllProviderServices);
router.get("/:serviceId", getServiceDetails);
router.post(
  "/",
  authMiddleware,
  authorizeRoles("provider", "admin"),
  uploadMiddleware.single("serviceImg"),
  createService
);
router.patch(
  "/:serviceId",
  authMiddleware,
  authorizeRoles("provider", "admin"),
  uploadMiddleware.single("serviceImg"),
  updateService
);

export default router;

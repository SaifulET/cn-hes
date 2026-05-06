import { Router } from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import authorizeRoles from "../../middleware/authorizeRoles.js";
import {
  createLegalContentController,
  getLegalContentController,
  updateLegalContentController
} from "./legalContent.controller.js";

const router = Router();

router.get("/:type", getLegalContentController);
router.post(
  "/",
  authMiddleware,
  authorizeRoles("admin"),
  createLegalContentController
);
router.patch(
  "/:type",
  authMiddleware,
  authorizeRoles("admin"),
  updateLegalContentController
);

export default router;

import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes.js";
import bookingRoutes from "./modules/booking/booking.routes.js";
import categoryRoutes from "./modules/category/category.routes.js";
import chatRoutes from "./modules/chat/chat.routes.js";
import legalContentRoutes from "./modules/legalContent/legalContent.routes.js";
import paymentRoutes from "./modules/payment/payment.routes.js";
import serviceRoutes from "./modules/service/service.routes.js";
import reviewRoutes from "./modules/review/review.routes.js";
import { stripeWithdrawalWebhookController } from "./modules/withdrawal/withdrawal.controller.js";
import withdrawalRoutes from "./modules/withdrawal/withdrawal.routes.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.post(
  "/api/v1/withdrawals/webhook/stripe",
  express.raw({ type: "application/json" }),
  stripeWithdrawalWebhookController
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "CN-HES API is running"
  });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "ok"
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/legal-contents", legalContentRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/services", serviceRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/withdrawals", withdrawalRoutes);

app.use(errorHandler);

export default app;

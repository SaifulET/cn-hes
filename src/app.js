import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes.js";
import bookingRoutes from "./modules/booking/booking.routes.js";
import categoryRoutes from "./modules/category/category.routes.js";
import chatRoutes from "./modules/chat/chat.routes.js";
import serviceRoutes from "./modules/service/service.routes.js";
import reviewRoutes from "./modules/review/review.routes.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
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
app.use("/api/v1/services", serviceRoutes);
app.use("/api/v1/reviews", reviewRoutes);

app.use(errorHandler);

export default app;

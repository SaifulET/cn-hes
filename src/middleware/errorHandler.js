import { sendError } from "../helpers/apiResponse.js";

const errorHandler = (error, _req, res, _next) => {
  if (error.name === "ValidationError") {
    return sendError(res, error.message, 400);
  }

  if (error.code === 11000) {
    return sendError(res, "Email already exists.", 409);
  }

  return sendError(
    res,
    error.message || "Internal server error.",
    error.statusCode || 500
  );
};

export default errorHandler;

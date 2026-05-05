import User from "../models/user.model.js";
import AppError from "../helpers/appError.js";
import { verifyAccessToken } from "../helpers/tokenHelper.js";

const authMiddleware = async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Authorization token is required.", 401));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return next(new AppError("User not found.", 404));
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    next(new AppError("Invalid or expired token.", 401));
  }
};

export default authMiddleware;

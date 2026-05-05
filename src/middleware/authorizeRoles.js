import AppError from "../helpers/appError.js";

const authorizeRoles = (...roles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError("Unauthorized access.", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError("You are not allowed to perform this action.", 403));
    }

    next();
  };
};

export default authorizeRoles;

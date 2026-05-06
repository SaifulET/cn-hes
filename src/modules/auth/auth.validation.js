import AppError from "../../helpers/appError.js";
import { USER_ROLES } from "../../constants/roles.js";

export const validateSignupInput = ({
  name,
  email,
  phone,
  password,
  confirmPassword,
  role
}) => {
  if (!name || !email || !phone || !password || !confirmPassword) {
    throw new AppError("Name, email, phone, password and confirmPassword are required.");
  }

  if (password !== confirmPassword) {
    throw new AppError("Password and confirmPassword do not match.");
  }

  if (role && !USER_ROLES.includes(role)) {
    throw new AppError("Role must be one of user, provider, or admin.");
  }
};

export const validateSigninInput = ({ email, password }) => {
  if (!email || !password) {
    throw new AppError("Email and password are required.");
  }
};

export const validatePasswordReset = ({ newPassword, confirmPassword }) => {
  if (!newPassword || !confirmPassword) {
    throw new AppError("newPassword and confirmPassword are required.");
  }

  if (newPassword !== confirmPassword) {
    throw new AppError("newPassword and confirmPassword do not match.");
  }
};

export const validateChangePasswordInput = ({
  oldPassword,
  newPassword,
  confirmPassword
}) => {
  if (!oldPassword || !newPassword || !confirmPassword) {
    throw new AppError(
      "oldPassword, newPassword and confirmPassword are required."
    );
  }

  if (newPassword !== confirmPassword) {
    throw new AppError("newPassword and confirmPassword do not match.");
  }

  if (oldPassword === newPassword) {
    throw new AppError("New password must be different from old password.");
  }
};

export const validateEmailOtpInput = ({ email, otp }) => {
  if (!email || !otp) {
    throw new AppError("Email and otp are required.");
  }
};

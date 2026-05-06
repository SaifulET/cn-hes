import AppError from "../../helpers/appError.js";

const withdrawalStatuses = ["pending", "processing", "paid", "failed", "cancelled"];
const connectedAccountStatuses = ["not_connected", "pending", "connected"];

export const validateCreateWithdrawalInput = ({
  amount,
  bankName,
  accountType,
  accountHolderName,
  accountNumber
}) => {
  if (amount === undefined) {
    throw new AppError("amount is required.");
  }

  if (Number.isNaN(Number(amount)) || Number(amount) <= 0) {
    throw new AppError("amount must be a valid positive number.");
  }

  if (!bankName || typeof bankName !== "string" || !bankName.trim()) {
    throw new AppError("bankName is required.");
  }

  if (!accountType || typeof accountType !== "string" || !accountType.trim()) {
    throw new AppError("accountType is required.");
  }

  if (
    !accountHolderName ||
    typeof accountHolderName !== "string" ||
    !accountHolderName.trim()
  ) {
    throw new AppError("accountHolderName is required.");
  }

  if (!accountNumber || typeof accountNumber !== "string" || !accountNumber.trim()) {
    throw new AppError("accountNumber is required.");
  }
};

export const validateWithdrawalStatus = (status) => {
  if (status && !withdrawalStatuses.includes(status)) {
    throw new AppError(
      "status must be pending, processing, paid, failed, or cancelled."
    );
  }
};

export const validateApproveWithdrawalInput = (_payload) => {};

export const validateConnectAccountInput = ({ country }) => {
  if (country !== undefined && typeof country !== "string") {
    throw new AppError("country must be a string.");
  }
};

export const validateConnectedAccountStatus = (status) => {
  if (status && !connectedAccountStatuses.includes(status)) {
    throw new AppError(
      "status must be not_connected, pending, or connected."
    );
  }
};

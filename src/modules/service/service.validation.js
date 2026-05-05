import AppError from "../../helpers/appError.js";

export const validateServiceInput = ({ categoryId, serviceName, address, serviceDetails }) => {
  if (!categoryId || !serviceName || !address || !serviceDetails) {
    throw new AppError(
      "categoryId, serviceName, address and serviceDetails are required."
    );
  }
};

import AppError from "../../helpers/appError.js";

export const validateReviewInput = ({ rating, reviewMessage }) => {
  if (!rating || !reviewMessage) {
    throw new AppError("rating and reviewMessage are required.");
  }

  const parsedRating = Number(rating);

  if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    throw new AppError("rating must be an integer between 1 and 5.");
  }
};

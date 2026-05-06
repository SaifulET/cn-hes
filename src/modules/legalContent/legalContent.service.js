import AppError from "../../helpers/appError.js";
import LegalContent from "../../models/legalContent.model.js";

export const createLegalContent = async (payload) => {
  const type = payload.type.trim();
  const title = payload.title.trim();
  const content = payload.content.trim();

  const existingLegalContent = await LegalContent.findOne({ type });

  if (existingLegalContent) {
    throw new AppError("Legal content already exists for this type.", 409);
  }

  return LegalContent.create({
    type,
    title,
    content
  });
};

export const updateLegalContent = async (type, payload) => {
  const legalContent = await LegalContent.findOne({ type });

  if (!legalContent) {
    throw new AppError("Legal content not found.", 404);
  }

  if (payload.title) {
    legalContent.title = payload.title.trim();
  }

  if (payload.content) {
    legalContent.content = payload.content.trim();
  }

  await legalContent.save();

  return legalContent;
};

export const getLegalContentByType = async (type) => {
  const legalContent = await LegalContent.findOne({ type });

  if (!legalContent) {
    throw new AppError("Legal content not found.", 404);
  }

  return legalContent;
};

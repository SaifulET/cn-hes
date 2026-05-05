import mongoose from "mongoose";
import AppError from "../../helpers/appError.js";
import Service from "../../models/service.model.js";
import Category from "../../models/category.model.js";
import { getServiceReviewStats } from "../../helpers/reviewStatsHelper.js";

const servicePopulate = [
  {
    path: "providerId",
    select: "name email phone profileImage address role"
  },
  {
    path: "categoryId",
    select: "categoryName icon"
  }
];

export const createProviderService = async (providerId, payload, file) => {
  if (!mongoose.Types.ObjectId.isValid(payload.categoryId)) {
    throw new AppError("Invalid category id.");
  }

  const category = await Category.findById(payload.categoryId);

  if (!category) {
    throw new AppError("Category not found.", 404);
  }

  const service = await Service.create({
    serviceImg: file?.location || "",
    categoryId: payload.categoryId,
    serviceName: payload.serviceName,
    address: payload.address,
    serviceDetails: payload.serviceDetails,
    providerId
  });

  await service.populate(servicePopulate);

  return service;
};

export const getAllProviderServicesPublic = async (providerId) => {
  if (!mongoose.Types.ObjectId.isValid(providerId)) {
    throw new AppError("Invalid provider id.");
  }

  return Service.find({ providerId }).populate(servicePopulate).sort({ createdAt: -1 });
};

export const getAllServicesPublic = async () => {
  return Service.find().populate(servicePopulate).sort({ createdAt: -1 });
};

export const getAllServicesByCategoryPublic = async (categoryId) => {
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new AppError("Invalid category id.");
  }

  return Service.find({ categoryId }).populate(servicePopulate).sort({ createdAt: -1 });
};

export const searchServicesByKeywordPublic = async (keyword) => {
  if (!keyword?.trim()) {
    throw new AppError("keyword query is required.");
  }

  return Service.find({
    serviceName: { $regex: keyword.trim(), $options: "i" }
  })
    .populate(servicePopulate)
    .sort({ createdAt: -1 });
};

export const getServiceDetailsPublic = async (serviceId) => {
  if (!mongoose.Types.ObjectId.isValid(serviceId)) {
    throw new AppError("Invalid service id.");
  }

  const service = await Service.findById(serviceId).populate(servicePopulate);

  if (!service) {
    throw new AppError("Service not found.", 404);
  }

  const reviewStats = await getServiceReviewStats(service._id);

  return {
    service,
    reviewStats
  };
};

export const editProviderService = async (providerId, serviceId, payload, file) => {
  if (!mongoose.Types.ObjectId.isValid(serviceId)) {
    throw new AppError("Invalid service id.");
  }

  const service = await Service.findOne({ _id: serviceId, providerId });

  if (!service) {
    throw new AppError("Service not found for this provider.", 404);
  }

  if (payload.categoryId) {
    if (!mongoose.Types.ObjectId.isValid(payload.categoryId)) {
      throw new AppError("Invalid category id.");
    }

    const category = await Category.findById(payload.categoryId);

    if (!category) {
      throw new AppError("Category not found.", 404);
    }

    service.categoryId = payload.categoryId;
  }

  if (payload.serviceName) {
    service.serviceName = payload.serviceName;
  }

  if (payload.address) {
    service.address = payload.address;
  }

  if (payload.serviceDetails) {
    service.serviceDetails = payload.serviceDetails;
  }

  if (file?.location) {
    service.serviceImg = file.location;
  }

  await service.save();
  await service.populate(servicePopulate);

  return service;
};

import asyncHandler from "../../helpers/asyncHandler.js";
import { sendSuccess } from "../../helpers/apiResponse.js";
import {
  createProviderService,
  editProviderService,
  getAllProviderServicesPublic,
  getAllServicesByCategoryPublic,
  getAllServicesPublic,
  getServiceDetailsPublic,
  searchServicesByKeywordPublic
} from "./service.service.js";
import { validateServiceInput } from "./service.validation.js";

export const createService = asyncHandler(async (req, res) => {
  validateServiceInput(req.body);
  const service = await createProviderService(req.user._id, req.body, req.file);

  return sendSuccess(res, "Service created successfully.", { service }, 201);
});

export const getAllProviderServices = asyncHandler(async (req, res) => {
  const services = await getAllProviderServicesPublic(req.params.providerId);
  return sendSuccess(res, "Provider services fetched successfully.", { services });
});

export const getAllServices = asyncHandler(async (_req, res) => {
  const services = await getAllServicesPublic();
  return sendSuccess(res, "All services fetched successfully.", { services });
});

export const getServicesByCategory = asyncHandler(async (req, res) => {
  const services = await getAllServicesByCategoryPublic(req.params.categoryId);
  return sendSuccess(res, "Category services fetched successfully.", { services });
});

export const searchServicesByKeyword = asyncHandler(async (req, res) => {
  const services = await searchServicesByKeywordPublic(req.query.keyword);
  return sendSuccess(res, "Services fetched successfully by keyword.", { services });
});

export const getServiceDetails = asyncHandler(async (req, res) => {
  const result = await getServiceDetailsPublic(req.params.serviceId);
  return sendSuccess(res, "Service details fetched successfully.", result);
});

export const updateService = asyncHandler(async (req, res) => {
  const service = await editProviderService(req.user._id, req.params.serviceId, req.body, req.file);
  return sendSuccess(res, "Service updated successfully.", { service });
});

import mongoose from "mongoose";
import AppError from "../../helpers/appError.js";
import Review from "../../models/review.model.js";
import Service from "../../models/service.model.js";
import { getServiceReviewStats, syncServiceReviewStats } from "../../helpers/reviewStatsHelper.js";

const reviewPopulate = {
  path: "userId",
  select: "name profileImage"
};

const formatReview = (review) => ({
  id: review._id,
  serviceId: review.serviceId,
  providerId: review.providerId,
  rating: review.rating,
  reviewMessage: review.reviewMessage,
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
  user: {
    id: review.userId?._id,
    name: review.userId?.name || "",
    profileImage: review.userId?.profileImage || ""
  }
});

export const createOrUpdateReview = async (user, serviceId, payload) => {
  if (!mongoose.Types.ObjectId.isValid(serviceId)) {
    throw new AppError("Invalid service id.");
  }

  const service = await Service.findById(serviceId);

  if (!service) {
    throw new AppError("Service not found.", 404);
  }

  const review = await Review.findOneAndUpdate(
    { serviceId, userId: user._id },
    {
      serviceId,
      providerId: service.providerId,
      userId: user._id,
      rating: Number(payload.rating),
      reviewMessage: payload.reviewMessage
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  ).populate(reviewPopulate);

  const reviewStats = await syncServiceReviewStats(service._id);

  return {
    review: formatReview(review),
    reviewStats
  };
};

const buildReviewListResponse = async (filter) => {
  const reviews = await Review.find(filter)
    .populate(reviewPopulate)
    .sort({ createdAt: -1 });

  const formattedReviews = reviews.map(formatReview);

  let reviewStats = {
    reviewCount: 0,
    overallRating: 0,
    ratingBreakdown: [
      { rating: 5, count: 0 },
      { rating: 4, count: 0 },
      { rating: 3, count: 0 },
      { rating: 2, count: 0 },
      { rating: 1, count: 0 }
    ]
  };

  if (filter.serviceId) {
    reviewStats = await getServiceReviewStats(filter.serviceId);
  }

  if (filter.providerId) {
    const [providerStats] = await Review.aggregate([
      { $match: { providerId: filter.providerId } },
      {
        $group: {
          _id: "$providerId",
          reviewCount: { $sum: 1 },
          overallRating: { $avg: "$rating" },
          rating1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
          rating2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
          rating3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
          rating4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
          rating5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } }
        }
      }
    ]);

    reviewStats = {
      reviewCount: providerStats?.reviewCount || 0,
      overallRating: providerStats?.overallRating
        ? Number(providerStats.overallRating.toFixed(1))
        : 0,
      ratingBreakdown: [
        { rating: 5, count: providerStats?.rating5 || 0 },
        { rating: 4, count: providerStats?.rating4 || 0 },
        { rating: 3, count: providerStats?.rating3 || 0 },
        { rating: 2, count: providerStats?.rating2 || 0 },
        { rating: 1, count: providerStats?.rating1 || 0 }
      ]
    };
  }

  return {
    reviews: formattedReviews,
    reviewStats
  };
};

export const getReviewsByServiceId = async (serviceId) => {
  if (!mongoose.Types.ObjectId.isValid(serviceId)) {
    throw new AppError("Invalid service id.");
  }

  return buildReviewListResponse({ serviceId: new mongoose.Types.ObjectId(serviceId) });
};

export const getReviewsByProviderId = async (providerId) => {
  if (!mongoose.Types.ObjectId.isValid(providerId)) {
    throw new AppError("Invalid provider id.");
  }

  return buildReviewListResponse({ providerId: new mongoose.Types.ObjectId(providerId) });
};

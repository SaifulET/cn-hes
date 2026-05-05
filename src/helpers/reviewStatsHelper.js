import Review from "../models/review.model.js";
import Service from "../models/service.model.js";

export const buildRatingBreakdown = (counts = {}) => {
  return [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: counts[rating] || 0
  }));
};

export const getServiceReviewStats = async (serviceId) => {
  const [summary] = await Review.aggregate([
    {
      $match: {
        serviceId
      }
    },
    {
      $group: {
        _id: "$serviceId",
        reviewCount: { $sum: 1 },
        overallRating: { $avg: "$rating" },
        rating1: {
          $sum: {
            $cond: [{ $eq: ["$rating", 1] }, 1, 0]
          }
        },
        rating2: {
          $sum: {
            $cond: [{ $eq: ["$rating", 2] }, 1, 0]
          }
        },
        rating3: {
          $sum: {
            $cond: [{ $eq: ["$rating", 3] }, 1, 0]
          }
        },
        rating4: {
          $sum: {
            $cond: [{ $eq: ["$rating", 4] }, 1, 0]
          }
        },
        rating5: {
          $sum: {
            $cond: [{ $eq: ["$rating", 5] }, 1, 0]
          }
        }
      }
    }
  ]);

  return {
    reviewCount: summary?.reviewCount || 0,
    overallRating: summary?.overallRating ? Number(summary.overallRating.toFixed(1)) : 0,
    ratingBreakdown: buildRatingBreakdown({
      1: summary?.rating1 || 0,
      2: summary?.rating2 || 0,
      3: summary?.rating3 || 0,
      4: summary?.rating4 || 0,
      5: summary?.rating5 || 0
    })
  };
};

export const syncServiceReviewStats = async (serviceId) => {
  const stats = await getServiceReviewStats(serviceId);

  await Service.findByIdAndUpdate(serviceId, {
    overallRating: stats.overallRating,
    reviewCount: stats.reviewCount
  });

  return stats;
};

import Payment from "../../models/payment.model.js";
import Booking from "../../models/booking.model.js";
import User from "../../models/user.model.js";
import AppError from "../../helpers/appError.js";

const adminTransactionPopulate = [
  {
    path: "bookingId",
    select: "serviceName serviceDetails price status createdAt"
  },
  {
    path: "providerId",
    select: "name email phone profileImage stripeBankAccount"
  },
  {
    path: "userId",
    select: "name email phone profileImage"
  },
  {
    path: "serviceId",
    select: "serviceName serviceImg address"
  }
];

const buildDateRange = (date) => {
  if (!date) {
    return null;
  }

  const selectedDate = new Date(date);
  const start = new Date(selectedDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(selectedDate);
  end.setHours(23, 59, 59, 999);

  return { $gte: start, $lte: end };
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildTransactionFilters = ({ paymentStatus, date, userName, providerName }) => {
  const paymentMatch = {};

  if (paymentStatus) {
    paymentMatch.paymentStatus = paymentStatus;
  }

  const dateRange = buildDateRange(date);
  if (dateRange) {
    paymentMatch.paymentDate = dateRange;
  }

  const userRegex = userName ? new RegExp(escapeRegex(userName.trim()), "i") : null;
  const providerRegex = providerName
    ? new RegExp(escapeRegex(providerName.trim()), "i")
    : null;

  return {
    paymentMatch,
    userRegex,
    providerRegex
  };
};

const getTransactionListPipeline = ({
  paymentMatch,
  userRegex,
  providerRegex,
  skip,
  limit
}) => {
  const pipeline = [
    { $match: paymentMatch },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user"
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "providerId",
        foreignField: "_id",
        as: "provider"
      }
    },
    {
      $lookup: {
        from: "bookings",
        localField: "bookingId",
        foreignField: "_id",
        as: "booking"
      }
    },
    {
      $unwind: {
        path: "$user",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind: {
        path: "$provider",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind: {
        path: "$booking",
        preserveNullAndEmptyArrays: true
      }
    }
  ];

  if (userRegex) {
    pipeline.push({ $match: { "user.name": userRegex } });
  }

  if (providerRegex) {
    pipeline.push({ $match: { "provider.name": providerRegex } });
  }

  pipeline.push(
    {
      $project: {
        _id: 1,
        amount: 1,
        paymentStatus: 1,
        paymentDate: 1,
        createdAt: 1,
        stripePaymentIntentId: 1,
        booking: {
          _id: "$booking._id",
          status: "$booking.status",
          serviceName: "$booking.serviceName"
        },
        user: {
          _id: "$user._id",
          name: "$user.name",
          email: "$user.email",
          phone: "$user.phone"
        },
        provider: {
          _id: "$provider._id",
          name: "$provider.name",
          email: "$provider.email",
          phone: "$provider.phone"
        }
      }
    },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        transactions: [
          { $sort: { paymentDate: -1, createdAt: -1 } },
          { $skip: skip },
          { $limit: limit }
        ]
      }
    }
  );

  return pipeline;
};

export const getAdminTransactionDashboard = async () => {
  const [paymentStats, bookingCount] = await Promise.all([
    Payment.aggregate([
      {
        $group: {
          _id: null,
          totalTransactionCount: { $sum: 1 },
          totalEarning: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "succeeded"] }, "$amount", 0]
            }
          },
          totalSuccessfulTransactions: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "succeeded"] }, 1, 0]
            }
          }
        }
      }
    ]),
    Booking.countDocuments()
  ]);

  const stats = paymentStats[0] || {
    totalTransactionCount: 0,
    totalEarning: 0,
    totalSuccessfulTransactions: 0
  };

  return {
    totalEarning: stats.totalEarning,
    totalBookingCount: bookingCount,
    totalTransactionCount: stats.totalTransactionCount,
    totalSuccessfulTransactionCount: stats.totalSuccessfulTransactions
  };
};

export const getAdminDashboardOverview = async () => {
  const [earningAgg, totalUsers, totalProviders] = await Promise.all([
    Payment.aggregate([
      {
        $match: {
          paymentStatus: "succeeded"
        }
      },
      {
        $group: {
          _id: null,
          totalEarning: { $sum: "$amount" }
        }
      }
    ]),
    User.countDocuments({ role: "user" }),
    User.countDocuments({ role: "provider" })
  ]);

  return {
    totalEarning: earningAgg[0]?.totalEarning || 0,
    totalUsers,
    totalProviders
  };
};

export const getAdminEarningsChart = async (year) => {
  const selectedYear = Number(year) || new Date().getFullYear();
  const startDate = new Date(selectedYear, 0, 1);
  const endDate = new Date(selectedYear + 1, 0, 1);

  const earnings = await Payment.aggregate([
    {
      $match: {
        paymentStatus: "succeeded",
        paymentDate: {
          $gte: startDate,
          $lt: endDate
        }
      }
    },
    {
      $group: {
        _id: { $month: "$paymentDate" },
        total: { $sum: "$amount" },
        transactionCount: { $sum: 1 }
      }
    },
    {
      $sort: {
        _id: 1
      }
    }
  ]);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthMap = new Map(earnings.map((entry) => [entry._id, entry]));

  const monthly = monthNames.map((month, index) => {
    const data = monthMap.get(index + 1);

    return {
      month,
      totalEarning: data?.total || 0,
      transactionCount: data?.transactionCount || 0
    };
  });

  return {
    year: selectedYear,
    totalEarning: monthly.reduce((sum, item) => sum + item.totalEarning, 0),
    monthly
  };
};

export const getAdminTransactions = async (query) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;
  const { paymentMatch, userRegex, providerRegex } = buildTransactionFilters(query);

  const [result] = await Payment.aggregate(
    getTransactionListPipeline({
      paymentMatch,
      userRegex,
      providerRegex,
      skip,
      limit
    })
  );

  const total = result?.metadata?.[0]?.total || 0;

  return {
    transactions: result?.transactions || [],
    pagination: {
      page,
      limit,
      total,
      totalPages: total ? Math.ceil(total / limit) : 0
    }
  };
};

export const getAdminTransactionDetails = async (transactionId) => {
  const payment = await Payment.findById(transactionId).populate(adminTransactionPopulate);

  if (!payment) {
    throw new AppError("Transaction not found.", 404);
  }

  return {
    transactionId: payment.stripePaymentIntentId || payment._id.toString(),
    paymentId: payment._id,
    amount: payment.amount,
    paymentStatus: payment.paymentStatus,
    paymentDate: payment.paymentDate,
    createdAt: payment.createdAt,
    booking: payment.bookingId,
    service: payment.serviceId,
    user: payment.userId,
    provider: payment.providerId,
    accountDetails: {
      bankName: payment.providerId?.stripeBankAccount?.bankName || "",
      accountHolderName:
        payment.providerId?.stripeBankAccount?.accountHolderName ||
        payment.providerId?.name ||
        "",
      accountHolderType: payment.providerId?.stripeBankAccount?.accountHolderType || "",
      accountNumberMasked: payment.providerId?.stripeBankAccount?.last4
        ? `**** **** **** ${payment.providerId.stripeBankAccount.last4}`
        : "",
      currency: payment.providerId?.stripeBankAccount?.currency || "",
      country: payment.providerId?.stripeBankAccount?.country || ""
    }
  };
};

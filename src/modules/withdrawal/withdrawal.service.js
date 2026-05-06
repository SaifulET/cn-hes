import mongoose from "mongoose";
import Stripe from "stripe";
import AppError from "../../helpers/appError.js";
import { env } from "../../config/env.js";
import Payment from "../../models/payment.model.js";
import User from "../../models/user.model.js";
import Withdrawal from "../../models/withdrawal.model.js";

const stripe = env.stripeSecretKey ? new Stripe(env.stripeSecretKey) : null;

const withdrawalPopulate = [
  {
    path: "providerId",
    select: "name email phone profileImage role stripeAccountId stripeAccountStatus"
  },
  {
    path: "approvedBy",
    select: "name email phone role"
  }
];

const ensureValidWithdrawalId = (withdrawalId) => {
  if (!mongoose.Types.ObjectId.isValid(withdrawalId)) {
    throw new AppError("Invalid withdrawal id.");
  }
};

const ensureStripeConfigured = () => {
  if (!stripe) {
    throw new AppError("Stripe is not configured on the server.", 500);
  }
};

const ensureConnectUrlsConfigured = () => {
  if (!env.stripeConnectRefreshUrl || !env.stripeConnectReturnUrl) {
    throw new AppError(
      "Stripe Connect return and refresh URLs are not configured on the server.",
      500
    );
  }
};

const getExternalAccountSummary = async (stripeAccountId) => {
  const externalAccounts = await stripe.accounts.listExternalAccounts(
    stripeAccountId,
    { object: "bank_account", limit: 1 }
  );
  const bankAccount = externalAccounts.data[0];

  return bankAccount
    ? {
        bankName: bankAccount.bank_name || "",
        last4: bankAccount.last4 || "",
        currency: bankAccount.currency || "",
        country: bankAccount.country || ""
      }
    : null;
};

const syncUserStripeAccountStatus = async (user) => {
  ensureStripeConfigured();

  if (!user.stripeAccountId) {
    user.stripeAccountStatus = "not_connected";
    await user.save();

    return {
      stripeAccountId: "",
      status: "not_connected",
      payoutsEnabled: false,
      detailsSubmitted: false,
      bankAccount: null
    };
  }

  const account = await stripe.accounts.retrieve(user.stripeAccountId);
  const status =
    account.payouts_enabled && account.details_submitted
      ? "connected"
      : "pending";

  user.stripeAccountStatus = status;
  await user.save();

  return {
    stripeAccountId: account.id,
    status,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
    bankAccount: await getExternalAccountSummary(account.id)
  };
};

const getProviderTotals = async (providerId) => {
  const [earningAgg, withdrawAgg] = await Promise.all([
    Payment.aggregate([
      {
        $match: {
          providerId: new mongoose.Types.ObjectId(providerId),
          paymentStatus: "succeeded"
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]),
    Withdrawal.aggregate([
      {
        $match: {
          providerId: new mongoose.Types.ObjectId(providerId),
          status: { $in: ["processing", "paid"] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ])
  ]);

  const totalEarning = earningAgg[0]?.total || 0;
  const totalWithdraw = withdrawAgg[0]?.total || 0;
  const eligibleAmount = Math.max(totalEarning - totalWithdraw, 0);

  return {
    totalEarning,
    totalWithdraw,
    eligibleAmount
  };
};

export const getProviderWithdrawalEligibility = async (providerId) => {
  return getProviderTotals(providerId);
};

export const createOrGetStripeConnectedAccount = async (user, payload) => {
  ensureStripeConfigured();

  if (!user.stripeAccountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: payload.country?.trim().toUpperCase() || "US",
      email: user.email,
      business_type: "individual",
      capabilities: {
        transfers: {
          requested: true
        }
      },
      metadata: {
        userId: user._id.toString()
      }
    });

    user.stripeAccountId = account.id;
    user.stripeAccountStatus = "pending";
    await user.save();
  }

  return syncUserStripeAccountStatus(user);
};

export const createStripeOnboardingLink = async (providerId) => {
  ensureStripeConfigured();
  ensureConnectUrlsConfigured();

  const user = await User.findById(providerId);

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  if (!user.stripeAccountId) {
    await createOrGetStripeConnectedAccount(user, {});
  }

  const accountLink = await stripe.accountLinks.create({
    account: user.stripeAccountId,
    refresh_url: env.stripeConnectRefreshUrl,
    return_url: env.stripeConnectReturnUrl,
    type: "account_onboarding"
  });

  return {
    stripeAccountId: user.stripeAccountId,
    onboardingUrl: accountLink.url,
    expiresAt: accountLink.expires_at
  };
};

export const getConnectedAccountStatus = async (providerId) => {
  ensureStripeConfigured();

  const user = await User.findById(providerId);

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  const accountStatus = await syncUserStripeAccountStatus(user);
  const summary = await getProviderTotals(providerId);

  return {
    ...accountStatus,
    summary
  };
};

export const createWithdrawalRequest = async (providerId, payload) => {
  ensureStripeConfigured();

  const user = await User.findById(providerId);

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  const accountStatus = await syncUserStripeAccountStatus(user);

  if (accountStatus.status !== "connected") {
    throw new AppError(
      "Please complete Stripe bank account onboarding before creating a withdrawal request.",
      400
    );
  }

  const { eligibleAmount, totalEarning, totalWithdraw } =
    await getProviderTotals(providerId);
  const amount = Number(payload.amount);

  if (amount > eligibleAmount) {
    throw new AppError(
      "Withdrawal amount cannot be greater than eligible withdrawal amount."
    );
  }

  const withdrawal = await Withdrawal.create({
    providerId,
    amount
  });

  await withdrawal.populate(withdrawalPopulate);

  return {
    withdrawal,
    summary: {
      totalEarning,
      totalWithdraw,
      eligibleAmount: Math.max(eligibleAmount - amount, 0)
    },
    stripeAccount: accountStatus
  };
};

export const getMyWithdrawals = async (providerId, status) => {
  const query = { providerId };

  if (status) {
    query.status = status;
  }

  return Withdrawal.find(query).populate(withdrawalPopulate).sort({ createdAt: -1 });
};

export const getAllWithdrawals = async (status) => {
  const query = {};

  if (status) {
    query.status = status;
  }

  return Withdrawal.find(query).populate(withdrawalPopulate).sort({ createdAt: -1 });
};

export const getWithdrawalDetails = async (requester, withdrawalId) => {
  ensureValidWithdrawalId(withdrawalId);

  const withdrawal = await Withdrawal.findById(withdrawalId).populate(
    withdrawalPopulate
  );

  if (!withdrawal) {
    throw new AppError("Withdrawal request not found.", 404);
  }

  const isProviderOwner =
    withdrawal.providerId?._id?.toString() === requester._id.toString();

  if (requester.role !== "admin" && !isProviderOwner) {
    throw new AppError("You are not allowed to view this withdrawal request.", 403);
  }

  return withdrawal;
};

export const approveWithdrawalRequest = async (adminId, withdrawalId, _payload, files) => {
  ensureStripeConfigured();
  ensureValidWithdrawalId(withdrawalId);

  const withdrawal = await Withdrawal.findById(withdrawalId);

  if (!withdrawal) {
    throw new AppError("Withdrawal request not found.", 404);
  }

  if (withdrawal.status !== "pending") {
    throw new AppError("Only pending withdrawal requests can be approved.");
  }

  const provider = await User.findById(withdrawal.providerId);

  if (!provider) {
    throw new AppError("Provider not found.", 404);
  }

  const accountStatus = await syncUserStripeAccountStatus(provider);

  if (accountStatus.status !== "connected") {
    throw new AppError(
      "Provider has not completed Stripe bank account onboarding.",
      400
    );
  }

  const { eligibleAmount } = await getProviderTotals(withdrawal.providerId);

  if (withdrawal.amount > eligibleAmount) {
    throw new AppError(
      "This withdrawal request exceeds the provider's eligible withdrawal amount."
    );
  }

  const amount = Math.round(Number(withdrawal.amount) * 100);

  const transfer = await stripe.transfers.create({
    amount,
    currency: env.stripeCurrency,
    destination: provider.stripeAccountId,
    metadata: {
      withdrawalId: withdrawal._id.toString(),
      providerId: provider._id.toString()
    }
  });

  const payout = await stripe.payouts.create(
    {
      amount,
      currency: env.stripeCurrency,
      metadata: {
        withdrawalId: withdrawal._id.toString(),
        providerId: provider._id.toString(),
        transferId: transfer.id
      }
    },
    {
      stripeAccount: provider.stripeAccountId
    }
  );

  withdrawal.status = payout.status === "paid" ? "paid" : "processing";
  withdrawal.transactionId = payout.id;
  withdrawal.transactionImages =
    files?.transactionImages?.map((file) => file.location) || [];
  withdrawal.approvedBy = adminId;
  withdrawal.approvedAt = new Date();
  withdrawal.paidAt = payout.status === "paid" ? new Date() : null;
  withdrawal.cancelledAt = null;
  withdrawal.stripeTransferId = transfer.id;
  withdrawal.stripePayoutId = payout.id;
  withdrawal.stripeResponse = {
    transfer,
    payout
  };
  await withdrawal.save();
  await withdrawal.populate(withdrawalPopulate);

  return withdrawal;
};

export const cancelWithdrawalRequest = async (withdrawalId) => {
  ensureValidWithdrawalId(withdrawalId);

  const withdrawal = await Withdrawal.findById(withdrawalId);

  if (!withdrawal) {
    throw new AppError("Withdrawal request not found.", 404);
  }

  if (withdrawal.status !== "pending") {
    throw new AppError("Only pending withdrawal requests can be cancelled.");
  }

  withdrawal.status = "cancelled";
  withdrawal.cancelledAt = new Date();
  await withdrawal.save();
  await withdrawal.populate(withdrawalPopulate);

  return withdrawal;
};

export const handleStripeWithdrawalWebhook = async (payload, signature) => {
  ensureStripeConfigured();

  if (!env.stripeWebhookSecret) {
    throw new AppError("Stripe webhook secret is not configured on the server.", 500);
  }

  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    env.stripeWebhookSecret
  );

  if (event.type === "payout.paid" || event.type === "payout.failed") {
    const payout = event.data.object;
    const withdrawal = await Withdrawal.findOne({ stripePayoutId: payout.id });

    if (withdrawal) {
      withdrawal.status = event.type === "payout.paid" ? "paid" : "failed";
      withdrawal.paidAt = event.type === "payout.paid" ? new Date() : null;
      withdrawal.stripeResponse = {
        ...(withdrawal.stripeResponse || {}),
        webhookPayout: payout
      };
      await withdrawal.save();
    }
  }

  return {
    type: event.type
  };
};

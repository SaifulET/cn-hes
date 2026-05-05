export const sanitizeUser = (user) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isVerified: user.isVerified,
    profileImage: user.profileImage,
    licenseFrontImage: user.licenseFrontImage,
    licenseBackImage: user.licenseBackImage,
    address: user.address,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

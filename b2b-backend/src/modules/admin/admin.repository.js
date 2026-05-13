import User from '../user/user.model.js';

export const findAllUsers = async () => {
  return User.find()
    .select('-password -refreshToken -otp') // 🔥 Exclude sensitive data
    .lean(); // 🔥 Performance: Convert to plain objects
};

export const updateUserStatus = async (userId, status) => {
  return User.findByIdAndUpdate(
    userId,
    { status },
    { new: true }
  );
};
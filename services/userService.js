import User from "../models/User.js";

export const getAllUsers = async () => {
  return await User.find();
};

export const findOrCreateUser = async (telegramId) => {
  let user = await User.findOne({ telegramId });

  if (!user) {
    user = await User.create({ telegramId });
  }

  return user;
};

export const getChatIdByUserId = async (userId) => {
  const user = await User.findById(userId).select("telegramId").lean();

  return user?.telegramId || "";
};

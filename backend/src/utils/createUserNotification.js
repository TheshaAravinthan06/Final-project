import UserNotification from "../models/userNotification.models.js";

export const createUserNotification = async ({
  recipient,
  actor = null,
  type,
  title,
  message,
  entityType = "none",
  entityId = null,
  previewImage = "",
}) => {
  try {
    if (!recipient) return null;

    return await UserNotification.create({
      recipient,
      actor,
      type,
      title,
      message,
      entityType,
      entityId,
      previewImage,
    });
  } catch (error) {
    console.error("createUserNotification error:", error.message);
    return null;
  }
};
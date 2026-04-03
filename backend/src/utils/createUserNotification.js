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

export const createBulkUserNotifications = async ({
  recipients = [],
  actor = null,
  type,
  title,
  message,
  entityType = "none",
  entityId = null,
  previewImage = "",
}) => {
  try {
    if (!Array.isArray(recipients) || recipients.length === 0) return [];

    const docs = recipients
      .filter(Boolean)
      .map((recipient) => ({
        recipient,
        actor,
        type,
        title,
        message,
        entityType,
        entityId,
        previewImage,
      }));

    if (!docs.length) return [];

    return await UserNotification.insertMany(docs);
  } catch (error) {
    console.error("createBulkUserNotifications error:", error.message);
    return [];
  }
};
import mongoose from "mongoose";
import Conversation from "../models/conversation.models.js";
import Message from "../models/message.models.js";
import User from "../models/user.models.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const includesId = (list = [], id) =>
  list.some((item) => String(item) === String(id));

const getOtherMember = (members = [], currentUserId) =>
  members.find((member) => String(member._id) !== String(currentUserId)) || null;

const buildConversationPayload = (conversation, currentUserId, unreadMap = {}) => {
  const otherUser = getOtherMember(conversation.members || [], currentUserId);

  return {
    _id: conversation._id,
    otherUser: otherUser
      ? {
          _id: otherUser._id,
          username: otherUser.username || "",
          name: otherUser.name || "",
          profileImage: otherUser.profileImage || "",
        }
      : null,
    members: conversation.members || [],
    isRequest: Boolean(conversation.isRequest),
    requestSender: conversation.requestSender || null,
    requestReceiver: conversation.requestReceiver || null,
    acceptedAt: conversation.acceptedAt || null,
    lastMessage: conversation.lastMessage || "",
    lastMessageSender: conversation.lastMessageSender || null,
    lastMessageAt: conversation.lastMessageAt || conversation.updatedAt,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    unreadCount: unreadMap[String(conversation._id)] || 0,
    isPinned: includesId(conversation.pinnedBy, currentUserId),
    isMuted: includesId(conversation.mutedBy, currentUserId),
    isBlockedByMe: includesId(conversation.blockedBy, currentUserId),
  };
};

const getUnreadMap = async (conversationIds, currentUserId) => {
  if (!conversationIds.length) return {};

  const unreadRows = await Message.aggregate([
    {
      $match: {
        conversationId: {
          $in: conversationIds.map((id) => new mongoose.Types.ObjectId(id)),
        },
        sender: { $ne: new mongoose.Types.ObjectId(currentUserId) },
        readBy: { $ne: new mongoose.Types.ObjectId(currentUserId) },
      },
    },
    {
      $group: {
        _id: "$conversationId",
        count: { $sum: 1 },
      },
    },
  ]);

  return unreadRows.reduce((acc, row) => {
    acc[String(row._id)] = row.count;
    return acc;
  }, {});
};

const getConversationForUser = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId).populate(
    "members",
    "username name profileImage blockedUsers following"
  );

  if (!conversation) {
    return null;
  }

  const isMember = conversation.members.some(
    (member) => String(member._id) === String(userId)
  );

  if (!isMember) {
    return null;
  }

  return conversation;
};

export const startConversation = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { receiverId } = req.body;

    if (!receiverId || !isValidObjectId(receiverId)) {
      return res.status(400).json({ message: "Valid receiverId is required." });
    }

    if (String(senderId) === String(receiverId)) {
      return res.status(400).json({ message: "You cannot message yourself." });
    }

    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId),
    ]);

    if (!sender || !receiver) {
      return res.status(404).json({ message: "User not found." });
    }

    if (
      includesId(sender.blockedUsers, receiverId) ||
      includesId(receiver.blockedUsers, senderId)
    ) {
      return res
        .status(403)
        .json({ message: "You cannot start a conversation with this user." });
    }

    let conversation = await Conversation.findOne({
      members: { $all: [senderId, receiverId] },
      $expr: { $eq: [{ $size: "$members" }, 2] },
    }).populate("members", "username name profileImage blockedUsers following");

    if (conversation) {
      if (includesId(conversation.deletedFor, senderId)) {
        conversation.deletedFor = conversation.deletedFor.filter(
          (id) => String(id) !== String(senderId)
        );
        await conversation.save();
      }

      return res.status(200).json({
        conversation: buildConversationPayload(conversation, senderId),
      });
    }

    const senderFollowsReceiver = includesId(sender.following, receiverId);

    conversation = await Conversation.create({
      members: [senderId, receiverId],
      isRequest: !senderFollowsReceiver,
      requestSender: senderId,
      requestReceiver: receiverId,
      acceptedAt: senderFollowsReceiver ? new Date() : null,
      lastMessageAt: new Date(),
    });

    conversation = await Conversation.findById(conversation._id).populate(
      "members",
      "username name profileImage blockedUsers following"
    );

    return res.status(201).json({
      conversation: buildConversationPayload(conversation, senderId),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getInboxConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const conversations = await Conversation.find({
      members: currentUserId,
      deletedFor: { $ne: currentUserId },
      $or: [
        { isRequest: false },
        {
          isRequest: true,
          requestSender: currentUserId,
        },
      ],
    })
      .populate("members", "username name profileImage")
      .sort({ updatedAt: -1 });

    const unreadMap = await getUnreadMap(
      conversations.map((item) => item._id),
      currentUserId
    );

    const items = conversations.map((conversation) =>
      buildConversationPayload(conversation, currentUserId, unreadMap)
    );

    return res.status(200).json({ conversations: items });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMessageRequests = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const conversations = await Conversation.find({
      isRequest: true,
      requestReceiver: currentUserId,
      deletedFor: { $ne: currentUserId },
    })
      .populate("members", "username name profileImage")
      .sort({ updatedAt: -1 });

    const unreadMap = await getUnreadMap(
      conversations.map((item) => item._id),
      currentUserId
    );

    const items = conversations.map((conversation) =>
      buildConversationPayload(conversation, currentUserId, unreadMap)
    );

    return res.status(200).json({ requests: items });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getUnreadSummary = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const visibleConversations = await Conversation.find({
      members: currentUserId,
      deletedFor: { $ne: currentUserId },
      $or: [
        { isRequest: false },
        {
          isRequest: true,
          requestReceiver: currentUserId,
        },
        {
          isRequest: true,
          requestSender: currentUserId,
        },
      ],
    }).select("_id isRequest requestReceiver requestSender");

    const visibleConversationIds = visibleConversations.map((item) => item._id);

    const unreadMessages = visibleConversationIds.length
      ? await Message.countDocuments({
          conversationId: { $in: visibleConversationIds },
          sender: { $ne: currentUserId },
          readBy: { $ne: currentUserId },
        })
      : 0;

    const requestCount = visibleConversations.filter(
      (item) =>
        item.isRequest && String(item.requestReceiver) === String(currentUserId)
    ).length;

    return res.status(200).json({
      unreadMessages,
      requestCount,
      totalBadgeCount: unreadMessages + requestCount,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getConversationMessages = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { conversationId } = req.params;

    if (!isValidObjectId(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation id." });
    }

    const conversation = await getConversationForUser(conversationId, currentUserId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    const messages = await Message.find({
      conversationId,
      deletedFor: { $ne: currentUserId },
    }).sort({ createdAt: 1 });

    await Message.updateMany(
      {
        conversationId,
        sender: { $ne: currentUserId },
        readBy: { $ne: currentUserId },
      },
      {
        $addToSet: { readBy: currentUserId },
      }
    );

    return res.status(200).json({ messages });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { conversationId } = req.params;
    const text = String(req.body?.text || "").trim();

    if (!text) {
      return res.status(400).json({ message: "Message text is required." });
    }

    if (!isValidObjectId(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation id." });
    }

    const conversation = await getConversationForUser(conversationId, currentUserId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    const otherUser = getOtherMember(conversation.members, currentUserId);

    if (!otherUser) {
      return res.status(400).json({ message: "Invalid conversation members." });
    }

    const [currentUser, otherUserFull] = await Promise.all([
      User.findById(currentUserId),
      User.findById(otherUser._id),
    ]);

    if (
      includesId(currentUser?.blockedUsers, otherUser._id) ||
      includesId(otherUserFull?.blockedUsers, currentUserId)
    ) {
      return res.status(403).json({ message: "You cannot send messages here." });
    }

    if (
      conversation.isRequest &&
      String(conversation.requestReceiver) === String(currentUserId) &&
      !conversation.acceptedAt
    ) {
      return res
        .status(403)
        .json({ message: "Accept this request before replying." });
    }

    if (includesId(conversation.deletedFor, currentUserId)) {
      conversation.deletedFor = conversation.deletedFor.filter(
        (id) => String(id) !== String(currentUserId)
      );
    }

    const message = await Message.create({
      conversationId,
      sender: currentUserId,
      text,
      readBy: [currentUserId],
    });

    conversation.lastMessage = text;
    conversation.lastMessageSender = currentUserId;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    return res.status(201).json({ message });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const acceptMessageRequest = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { conversationId } = req.params;

    const conversation = await getConversationForUser(conversationId, currentUserId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    if (
      !conversation.isRequest ||
      String(conversation.requestReceiver) !== String(currentUserId)
    ) {
      return res.status(403).json({ message: "You cannot accept this request." });
    }

    conversation.isRequest = false;
    conversation.acceptedAt = new Date();
    await conversation.save();

    const unreadMap = await getUnreadMap([conversation._id], currentUserId);

    return res.status(200).json({
      message: "Message request accepted.",
      conversation: buildConversationPayload(conversation, currentUserId, unreadMap),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const togglePinConversation = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { conversationId } = req.params;

    const conversation = await getConversationForUser(conversationId, currentUserId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    if (includesId(conversation.pinnedBy, currentUserId)) {
      conversation.pinnedBy = conversation.pinnedBy.filter(
        (id) => String(id) !== String(currentUserId)
      );
    } else {
      conversation.pinnedBy.push(currentUserId);
    }

    await conversation.save();

    return res.status(200).json({
      message: "Pin status updated.",
      isPinned: includesId(conversation.pinnedBy, currentUserId),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const toggleMuteConversation = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { conversationId } = req.params;

    const conversation = await getConversationForUser(conversationId, currentUserId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    if (includesId(conversation.mutedBy, currentUserId)) {
      conversation.mutedBy = conversation.mutedBy.filter(
        (id) => String(id) !== String(currentUserId)
      );
    } else {
      conversation.mutedBy.push(currentUserId);
    }

    await conversation.save();

    return res.status(200).json({
      message: "Mute status updated.",
      isMuted: includesId(conversation.mutedBy, currentUserId),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const toggleBlockConversation = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { conversationId } = req.params;

    const conversation = await getConversationForUser(conversationId, currentUserId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    const otherUser = getOtherMember(conversation.members, currentUserId);

    if (!otherUser) {
      return res.status(400).json({ message: "Other user not found." });
    }

    const currentUser = await User.findById(currentUserId);

    if (!currentUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const alreadyBlocked = includesId(currentUser.blockedUsers, otherUser._id);

    if (alreadyBlocked) {
      currentUser.blockedUsers = currentUser.blockedUsers.filter(
        (id) => String(id) !== String(otherUser._id)
      );

      conversation.blockedBy = conversation.blockedBy.filter(
        (id) => String(id) !== String(currentUserId)
      );
    } else {
      currentUser.blockedUsers.push(otherUser._id);

      if (!includesId(conversation.blockedBy, currentUserId)) {
        conversation.blockedBy.push(currentUserId);
      }
    }

    await currentUser.save();
    await conversation.save();

    return res.status(200).json({
      message: alreadyBlocked ? "User unblocked." : "User blocked.",
      isBlockedByMe: !alreadyBlocked,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteConversationForCurrentUser = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { conversationId } = req.params;

    const conversation = await getConversationForUser(conversationId, currentUserId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    if (
      conversation.isRequest &&
      String(conversation.requestReceiver) === String(currentUserId) &&
      !conversation.acceptedAt
    ) {
      await Message.deleteMany({ conversationId });
      await Conversation.findByIdAndDelete(conversationId);

      return res.status(200).json({ message: "Message request deleted." });
    }

    if (!includesId(conversation.deletedFor, currentUserId)) {
      conversation.deletedFor.push(currentUserId);
      await conversation.save();
    }

    return res.status(200).json({ message: "Chat deleted for you." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
const mongoose = require("mongoose");
const User = require("../../Models/userModel");
const Partner = require("../../Models/partner/partnerModel");

const addNotification = async (req, res) => {
  const { userId, partnerId, messageTitle, messageBody } = req.body;

  if (!messageTitle || !messageBody) {
    return res
      .status(400)
      .json({ error: "Message title and body are required" });
  }

  try {
    if (userId && partnerId) {
      // Check if both userId and partnerId are arrays
      if (Array.isArray(userId) && Array.isArray(partnerId)) {
        // Handle both arrays scenario
        const users = await User.find({ _id: { $in: userId } });
        const partners = await Partner.find({ _id: { $in: partnerId } });

        if (!users || users.length !== userId.length) {
          return res.status(404).json({ error: "One or more users not found" });
        }
        if (!partners || partners.length !== partnerId.length) {
          return res
            .status(404)
            .json({ error: "One or more partners not found" });
        }

        for (const user of users) {
          user.notifications.push({ messageTitle, messageBody });
          await user.save();
        }

        for (const partner of partners) {
          partner.notifications.push({ messageTitle, messageBody });
          await partner.save();
        }

        return res.status(200).json({
          success: true,
          message: "Notifications added to users and partners",
        });
      } else {
        // Handle single userId and partnerId scenario
        return res.status(400).json({
          error: "Cannot specify both userId and partnerId as arrays",
        });
      }
    } else if (userId) {
      // Handle userId scenario
      if (Array.isArray(userId)) {
        // Handle array of userIds
        const users = await User.find({ _id: { $in: userId } });
        if (!users || users.length !== userId.length) {
          return res.status(404).json({ error: "One or more users not found" });
        }
        for (const user of users) {
          user.notifications.push({ messageTitle, messageBody });
          await user.save();
        }
        return res
          .status(200)
          .json({ success: true, message: "Notifications added to users" });
      } else {
        // Handle single userId
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        user.notifications.push({ messageTitle, messageBody });
        await user.save();
        return res
          .status(200)
          .json({ success: true, message: "Notification added to user" });
      }
    } else if (partnerId) {
      // Handle partnerId scenario
      if (Array.isArray(partnerId)) {
        // Handle array of partnerIds
        const partners = await Partner.find({ _id: { $in: partnerId } });
        if (!partners || partners.length !== partnerId.length) {
          return res
            .status(404)
            .json({ error: "One or more partners not found" });
        }
        for (const partner of partners) {
          partner.notifications.push({ messageTitle, messageBody });
          await partner.save();
        }
        return res
          .status(200)
          .json({ success: true, message: "Notifications added to partners" });
      } else {
        // Handle single partnerId
        const partner = await Partner.findById(partnerId);
        if (!partner) {
          return res.status(404).json({ error: "Partner not found" });
        }
        partner.notifications.push({ messageTitle, messageBody });
        await partner.save();
        return res
          .status(200)
          .json({ success: true, message: "Notification added to partner" });
      }
    } else {
      return res
        .status(400)
        .json({ error: "Either userId or partnerId is required" });
    }
  } catch (error) {
    console.error(`Error adding notification: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
};

const updateNotification = async (req, res) => {
  const { notificationId } = req.params;
  const { messageTitle, messageBody } = req.body;

  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    return res.status(400).json({ error: "Invalid notification ID" });
  }

  try {
    let notificationUpdated = false;

    // Check if the notification exists in User documents
    const userNotification = await User.findOne({
      "notifications._id": notificationId,
    });
    if (userNotification) {
      await User.updateOne(
        { "notifications._id": notificationId },
        {
          $set: {
            "notifications.$.messageTitle": messageTitle,
            "notifications.$.messageBody": messageBody,
          },
        }
      );
      notificationUpdated = true;
    }

    // Check if the notification exists in Partner documents
    const partnerNotification = await Partner.findOne({
      "notifications._id": notificationId,
    });
    if (partnerNotification) {
      await Partner.updateOne(
        { "notifications._id": notificationId },
        {
          $set: {
            "notifications.$.messageTitle": messageTitle,
            "notifications.$.messageBody": messageBody,
          },
        }
      );
      notificationUpdated = true;
    }

    if (!notificationUpdated) {
      return res.status(404).json({ error: "Notification not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Notification updated successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "An error occurred while updating the notification" });
  }
};

const deleteNotification = async (req, res) => {
  const { notificationId } = req.params;

  // Check if notificationId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    return res.status(400).json({ error: "Invalid notification ID" });
  }

  try {
    // Attempt to delete the notification from User collection
    const userUpdateResult = await User.updateOne(
      { "notifications._id": notificationId },
      { $pull: { notifications: { _id: notificationId } } }
    );

    // Attempt to delete the notification from Partner collection
    const partnerUpdateResult = await Partner.updateOne(
      { "notifications._id": notificationId },
      { $pull: { notifications: { _id: notificationId } } }
    );

    // If any notification was deleted from either collection
    if (
      userUpdateResult.modifiedCount > 0 ||
      partnerUpdateResult.modifiedCount > 0
    ) {
      return res
        .status(200)
        .json({ success: true, message: "Notification deleted successfully" });
    }

    // If no notification was deleted from either collection
    return res
      .status(404)
      .json({ success: false, message: "Notification not found" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while deleting the notification" });
  }
};

const getAllNotifications = async (req, res) => {
  try {
    const users = await User.find({}, "firstName lastName _id notifications"); // Fetch only notifications
    if (!users) {
      return res
        .status(404)
        .json({ message: "No notifications found for users" });
    }
    const userNotifications = users.flatMap((user) =>
      user.notifications.map((notification) => ({
        messageTitle: notification.messageTitle,
        messageBody: notification.messageBody,
        notificationId: notification._id,
        createdAt: notification.createdAt,
        userId: user._id,
        userName: `${user.firstName} ${user.lastName}`,
      }))
    );

    const partners = await Partner.find({}, "partnerName _id notifications"); // Fetch only notifications
    if (!partners) {
      return res
        .status(404)
        .json({ message: "No notifications found for partners" });
    }
    const partnerNotifications = partners.flatMap((partner) =>
      partner.notifications.map((notification) => ({
        messageTitle: notification.messageTitle,
        messageBody: notification.messageBody,
        notificationId: notification._id,
        createdAt: notification.createdAt,
        partnerId: partner._id,
        partnerName: partner.partnerName,
      }))
    );

    // Combine notifications
    const allNotifications = [...userNotifications, ...partnerNotifications];

    res.status(200).json({ allNotifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the ID belongs to a user
    const user = await User.findOne({ _id: id });
    if (user) {
      const userNotifications = user.notifications.map((notification) => ({
        messageTitle: notification.messageTitle,
        messageBody: notification.messageBody,
        notificationId: notification._id,
        createdAt: notification.createdAt,
        userId: user._id,
        userName: `${user.firstName} ${user.lastName}`,
        seen: notification.seen
      }));

      return res.status(200).json({ success: true, data: userNotifications });
    }

    // Check if the ID belongs to a partner
    const partner = await Partner.findOne({ _id: id });
    if (partner) {
      const partnerNotifications = partner.notifications.map((notification) => ({
        messageTitle: notification.messageTitle,
        messageBody: notification.messageBody,
        notificationId: notification._id,
        createdAt: notification.createdAt,
        partnerId: partner._id,
        partnerName: partner.partnerName,
        seen: notification.seen
      }));

      return res.status(200).json({ success: true, data: partnerNotifications });
    }

    // If neither a user nor a partner is found, return 404
    return res.status(404).json({ message: "User or Partner not found" });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const updateNotificationSeen = async (req, res) => {
  const { notificationId } = req.params;
  const { seen } = req.body; // Extract `seen` from the request body

  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    return res.status(400).json({ error: "Invalid notification ID" });
  }

  if (typeof seen !== "boolean") {
    return res.status(400).json({ error: "Invalid or missing 'seen' value" });
  }

  try {
    let notificationUpdated = false;

    // Update User notifications
    const userNotification = await User.findOne({
      "notifications._id": notificationId,
    });
    if (userNotification) {
      await User.updateOne(
        { "notifications._id": notificationId },
        { $set: { "notifications.$.seen": seen } }
      );
      notificationUpdated = true;
    }

    // Update Partner notifications
    const partnerNotification = await Partner.findOne({
      "notifications._id": notificationId,
    });
    if (partnerNotification) {
      await Partner.updateOne(
        { "notifications._id": notificationId },
        { $set: { "notifications.$.seen": seen } }
      );
      notificationUpdated = true;
    }

    if (!notificationUpdated) {
      return res.status(404).json({ error: "Notification not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Notification seen status updated successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "An error occurred while updating the notification" });
  }
};

exports.addNotification = addNotification;
exports.getAllNotifications = getAllNotifications;
exports.updateNotification = updateNotification;
exports.deleteNotification = deleteNotification;
exports.getNotificationById = getNotificationById;
exports.updateNotificationSeen =  updateNotificationSeen;
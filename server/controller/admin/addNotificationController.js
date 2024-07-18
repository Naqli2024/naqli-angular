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
            return res.status(404).json({ error: "One or more partners not found" });
          }
  
          for (const user of users) {
            user.notifications.push({ messageTitle, messageBody });
            await user.save();
          }
  
          for (const partner of partners) {
            partner.notifications.push({ messageTitle, messageBody });
            await partner.save();
          }
  
          return res.status(200).json({ success: true, message: "Notifications added to users and partners" });
  
        } else {
          // Handle single userId and partnerId scenario
          return res.status(400).json({ error: "Cannot specify both userId and partnerId as arrays" });
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
          return res.status(200).json({ success: true, message: "Notifications added to users" });
        } else {
          // Handle single userId
          const user = await User.findById(userId);
          if (!user) {
            return res.status(404).json({ error: "User not found" });
          }
          user.notifications.push({ messageTitle, messageBody });
          await user.save();
          return res.status(200).json({ success: true, message: "Notification added to user" });
        }
      } else if (partnerId) {
        // Handle partnerId scenario
        if (Array.isArray(partnerId)) {
          // Handle array of partnerIds
          const partners = await Partner.find({ _id: { $in: partnerId } });
          if (!partners || partners.length !== partnerId.length) {
            return res.status(404).json({ error: "One or more partners not found" });
          }
          for (const partner of partners) {
            partner.notifications.push({ messageTitle, messageBody });
            await partner.save();
          }
          return res.status(200).json({ success: true, message: "Notifications added to partners" });
        } else {
          // Handle single partnerId
          const partner = await Partner.findById(partnerId);
          if (!partner) {
            return res.status(404).json({ error: "Partner not found" });
          }
          partner.notifications.push({ messageTitle, messageBody });
          await partner.save();
          return res.status(200).json({ success: true, message: "Notification added to partner" });
        }
      } else {
        return res.status(400).json({ error: "Either userId or partnerId is required" });
      }
  
    } catch (error) {
      console.error(`Error adding notification: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
};


const getLastNotification = async (req, res) => {
    const { id } = req.body;
  
    try {
      let userNotification, partnerNotification;
  
      // Find in User collection
      userNotification = await User.findById(id).select('notifications').lean().exec();
  
      // Find in Partner collection if not found in User
      if (!userNotification) {
        partnerNotification = await Partner.findById(id).select('notifications').lean().exec();
      }
  
      // Determine which notification array to use
      const notifications = userNotification ? userNotification.notifications : partnerNotification?.notifications;
  
      // If notifications array exists, find the last notification
      if (notifications && notifications.length > 0) {
        const lastNotification = notifications[notifications.length - 1];
        return res.status(200).json(lastNotification);
      } else {
        return res.status(404).json({ error: 'No notifications found' });
      }
    } catch (error) {
      console.error(`Error fetching last notification: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
  };
  

exports.addNotification = addNotification;
exports.getLastNotification = getLastNotification;
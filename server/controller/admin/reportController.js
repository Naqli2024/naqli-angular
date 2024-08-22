const User = require("../../Models/userModel");
const Partner = require("../../Models/partner/partnerModel");
const { constants } = require("buffer");

const createReportRequest = async (req, res) => {
  try {
    const { email, reportMessage } = req.body;

    // Check if email exists in User or Partner collection
    let user = await User.findOne({ emailAddress: email });
    let partner = await Partner.findOne({ email });

    if (!user && !partner) {
      return res
        .status(400)
        .json({ success: false, message: "User or Partner does not exist." });
    }

    const name = user ? `${user.firstName} ${user.lastName}` : partner.partnerName;

    // Create the report request object
    const reportRequest = {
      reportMessage,
      isOpen: true,
      createdAt: Date.now(),
      name: name,
      pictureOfTheReport: req.file
        ? {
            fileName: req.file.filename,
            contentType: req.file.mimetype,
          }
        : undefined,
    };

    if (user) {
      // Add report request to user's reportRequest array
      user.reportRequest.push(reportRequest);
      await user.save();
    } else if (partner) {
      // Add report request to partner's reportRequest array
      partner.reportRequest.push(reportRequest);
      await partner.save();
    }

    res
      .status(201)
      .json({ success: true, message: "ReportRequest created successfully" });
  } catch (error) {
    console.error("Error creating ReportRequest:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


const updateReportRequest = async (req, res) => {
  try {
    const { ticketId, responseMessage } = req.body;

    // Find the report request in User collection
    let user = await User.findOne({ 'reportRequest._id': ticketId });
    let partner = await Partner.findOne({ 'reportRequest._id': ticketId });

    let reportRequest;
    let userType;

    if (user) {
      reportRequest = user.reportRequest.id(ticketId);
      userType = 'User';
    } else if (partner) {
      reportRequest = partner.reportRequest.id(ticketId);
      userType = 'Partner';
    } else {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    // Update the report request with the response message
    reportRequest.responseMessage = responseMessage;
    reportRequest.isOpen = false;

    // Create the notification
    const notification = {
      messageTitle: 'Response to your report',
      messageBody: responseMessage,
      createdAt: Date.now(),
    };

    if (userType === 'User') {
      // Save the user with the updated report request and notification
      user.notifications.push(notification);
      await user.save();
    } else {
      // Save the partner with the updated report request and notification
      partner.notifications.push(notification);
      await partner.save();
    }

    res.status(200).json({ success: true, message: 'Report request updated and notification sent.' });
  } catch (error) {
    console.error('Error updating report request:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


const getAllTickets = async (req, res) => {
  try {
    const user = await User.find({}, "reportRequest");
    const partner = await Partner.find({}, "reportRequest");

    const combinedRequest = [...user, ...partner].reduce((acc, curr) => {
      return acc.concat(curr.reportRequest);
    }, []);

    res.status(200).json({ success: true, data: combinedRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


const deleteTicketByTicketId = async(req, res) => {
  try {
    const { ticketId } = req.body;

    // First, check if the ticket exists in the User collection
    const user = await User.findOne({ 'reportRequest._id': ticketId });
    if (user) {
      // Remove the ticket from the User collection
      user.reportRequest = user.reportRequest.filter(ticket => ticket._id.toString() !== ticketId);
      await user.save();
      return res.status(200).json({ message: 'Ticket deleted from User collection' });
    }

    // If not found in User collection, check in the Partner collection
    const partner = await Partner.findOne({ 'reportRequest._id': ticketId });
    if (partner) {
      // Remove the ticket from the Partner collection
      partner.reportRequest = partner.reportRequest.filter(ticket => ticket._id.toString() !== ticketId);
      await partner.save();
      return res.status(200).json({ message: 'Ticket deleted from Partner collection' });
    }

    // If the ticket is not found in either collection
    res.status(404).json({ message: 'Ticket not found' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}



exports.createReportRequest = createReportRequest;
exports.getAllTickets = getAllTickets;
exports.updateReportRequest = updateReportRequest;
exports.deleteTicketByTicketId = deleteTicketByTicketId;
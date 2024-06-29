const Partner = require("../../Models/partner/partnerModel");

const getPartnerDetails = async(req,res) => {
    try {
      const partnerId = req.params.id; 
      const partner = await Partner.findById(partnerId).populate('operators');
  
      if(!partner) {
        return res.status(404).json({ message: 'Partner not found' });
      }
  
      res.status(200).json({success: true, data: partner});
    } catch (error) {
      console.error('Error fetching partner details:', error.message);
      res.status(500).json({ message: error.message });
    }
  }

exports.getPartnerDetails = getPartnerDetails;
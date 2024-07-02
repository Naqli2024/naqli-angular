const jwt = require('jsonwebtoken');
const User = require('../Models/userModel'); 
const partner = require('../Models/partner/partnerModel');

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JSON_WEB_TOKEN);
        
        if (decoded.userId) {
          req.user = await User.findById(decoded.userId).select('-password');
          if (!req.user) {
            console.log('User not found:', decoded.userId);
            return res.status(401).json({ message: 'Not authorized, user not found' });
          }
        }else if (decoded.partnerId) {
          req.partner = await partner.findById(decoded.partnerId).select('-password');
          if (!req.partner) {
            console.log('Partner not found:', decoded.partnerId);
            return res.status(401).json({ message: 'Not authorized, partner not found' });
          }
        }else {
          return res.status(401).json({ message: 'Not authorized, invalid token' });
        }
  
        next();
      } catch (err) {
        console.error('Token Error:', err);
        res.status(401).json({ message: 'Not authorized, token failed' });
      }
    } else {
      res.status(401).json({ message: 'Not authorized, no token' });
    }
  };

module.exports = { protect };
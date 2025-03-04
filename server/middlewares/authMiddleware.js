const jwt = require('jsonwebtoken');
const User = require('../Models/userModel'); 
const partner = require('../Models/partner/partnerModel');

const protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];

      try {
          const decoded = jwt.verify(token, process.env.JSON_WEB_TOKEN);

          if (!decoded.userId && !decoded.partnerId) {
              return res.status(401).json({ message: 'Not authorized, invalid token' });
          }

          if (decoded.userId) {
              req.user = await User.findById(decoded.userId).select('-password');
              if (!req.user) {
                  console.warn(`User not found: ${decoded.userId}`);
                  return res.status(401).json({ message: 'Not authorized, user not found' });
              }
          } else if (decoded.partnerId) {
              req.partner = await Partner.findById(decoded.partnerId).select('-password');
              if (!req.partner) {
                  console.warn(`Partner not found: ${decoded.partnerId}`);
                  return res.status(401).json({ message: 'Not authorized, partner not found' });
              }
          }

          next();
      } catch (err) {
          if (err.name === 'TokenExpiredError') {
              console.error('JWT Token Expired:', err.expiredAt);
              return res.status(401).json({ message: 'Session expired, please login again' });
          }
          console.error('Token Verification Error:', err.message);
          return res.status(401).json({ message: 'Not authorized, token invalid' });
      }
  } else {
      return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };
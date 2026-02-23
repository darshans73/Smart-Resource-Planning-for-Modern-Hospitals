const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
  }
  next();
};

const adminOrDoctor = (req, res, next) => {
  if (!['admin', 'doctor'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }
  next();
};

const adminOrReception = (req, res, next) => {
  if (!['admin', 'reception'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }
  next();
};

module.exports = { authMiddleware, adminOnly, adminOrDoctor, adminOrReception };

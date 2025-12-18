const adminAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, please login'
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required'
    });
  }

  next();
};

module.exports = { adminAuth };
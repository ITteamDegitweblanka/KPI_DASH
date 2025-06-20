// Middleware to check user role for protected routes
module.exports = function(requiredRoles) {
  return function(req, res, next) {
    // Assumes req.user is set by authentication middleware (e.g., JWT)
    const userRole = req.user && req.user.role;
    if (!userRole) {
      return res.status(401).json({ message: 'Unauthorized: No user role found' });
    }
    if (!requiredRoles.includes(userRole)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient privileges' });
    }
    next();
  };
};

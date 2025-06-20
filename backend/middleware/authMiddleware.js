const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const authHeader = req.headers['authorization'];
  console.log('[authMiddleware] Authorization header:', authHeader);
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];
  console.log('[authMiddleware] Token:', token);
  if (!token) return res.status(401).json({ message: 'Malformed token' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('[authMiddleware] JWT verify error:', err);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    console.log('[authMiddleware] Decoded user:', user);
    req.user = user;
    next();
  });
};

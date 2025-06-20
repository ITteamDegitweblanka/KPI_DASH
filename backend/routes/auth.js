const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const authMiddleware = require('../middleware/authMiddleware');
const db = require('../config/db');

router.post('/register', authController.register);
router.post('/login', authController.login);

// Get current user profile from JWT
router.get('/me', authMiddleware, (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ message: 'Invalid token' });
  db.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ user: results[0] });
  });
});

module.exports = router;

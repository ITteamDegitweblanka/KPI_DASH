const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users');
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware');

// Set up multer for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/avatars'));
  },
  filename: function (req, file, cb) {
    // Use timestamp and random string for filename to avoid collision
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `avatar_${uniqueSuffix}${ext}`);
  }
});
const upload = multer({ storage });

router.get('/', usersController.getAll);
router.get('/:id', usersController.getById);
router.put('/:id', usersController.update);
router.delete('/:id', usersController.delete);
router.post('/', usersController.create);

// Get user profile in frontend-expected format
router.get('/:id/profile', (req, res) => {
  const db = require('../config/db');
  db.query('SELECT * FROM users WHERE id = ?', [req.params.id], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: { user: results[0] } });
  });
});

// Avatar upload endpoint
router.post('/:id/avatar', upload.single('avatar'), usersController.uploadAvatar);

// Serve avatar image from DB as binary
router.get('/:id/avatar', (req, res) => {
  const db = require('../config/db');
  db.query('SELECT avatar, avatarMimeType FROM users WHERE id = ?', [req.params.id], (err, results) => {
    if (err || results.length === 0 || !results[0].avatar) {
      return res.status(404).send('No avatar found');
    }
    res.set('Content-Type', results[0].avatarMimeType || 'image/jpeg');
    res.send(results[0].avatar);
  });
});

// Auth middleware to set req.user from token
router.get('/me', authMiddleware, usersController.getMe);

module.exports = router;

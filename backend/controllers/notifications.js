const db = require('../config/db');

exports.getAll = (req, res) => {
  db.query('SELECT * FROM notifications', (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching notifications', error: err });
    res.json(results);
  });
};

exports.getById = (req, res) => {
  db.query('SELECT * FROM notifications WHERE id = ?', [req.params.id], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ message: 'Notification not found' });
    res.json(results[0]);
  });
};

exports.create = (req, res) => {
  const { userId, type, message } = req.body;
  db.query('INSERT INTO notifications (userId, type, message) VALUES (?, ?, ?)', [userId, type, message], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error creating notification', error: err });
    res.status(201).json({ id: result.insertId });
  });
};

exports.markAsRead = (req, res) => {
  db.query('UPDATE notifications SET isRead=1 WHERE id=?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error marking as read', error: err });
    res.json({ message: 'Notification marked as read' });
  });
};

exports.delete = (req, res) => {
  db.query('DELETE FROM notifications WHERE id=?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error deleting notification', error: err });
    res.json({ message: 'Notification deleted' });
  });
};

exports.getByUserId = (req, res) => {
  const userId = req.params.userId;
  db.query('SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC', [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching notifications', error: err });
    res.json({ success: true, data: results });
  });
};

exports.markAllAsRead = (req, res) => {
  const userId = req.params.userId;
  db.query('UPDATE notifications SET isRead=1 WHERE userId=?', [userId], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error marking all as read', error: err });
    res.json({ message: 'All notifications marked as read' });
  });
};

exports.clearAll = (req, res) => {
  const userId = req.params.userId;
  db.query('DELETE FROM notifications WHERE userId=?', [userId], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error clearing notifications', error: err });
    res.json({ message: 'All notifications cleared' });
  });
};

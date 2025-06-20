const db = require('../config/db');
const bcrypt = require('bcryptjs');
const fs = require('fs');

// Get all users with their teams
exports.getAll = (req, res) => {
  const sql = `
    SELECT u.*, 
      GROUP_CONCAT(t.name) AS teamNames,
      GROUP_CONCAT(t.id) AS teamIds
    FROM users u
    LEFT JOIN user_teams ut ON u.id = ut.userId
    LEFT JOIN teams t ON ut.teamId = t.id
    GROUP BY u.id
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching users', error: err });
    // Map teams to array or string for frontend compatibility
    const users = results.map(user => ({
      ...user,
      team: user.teamNames ? user.teamNames.split(',') : [],
      teamIds: user.teamIds ? user.teamIds.split(',') : [],
    }));
    res.json({ success: true, data: users });
  });
};

// Get user by ID
exports.getById = (req, res) => {
  db.query('SELECT * FROM users WHERE id = ?', [req.params.id], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(results[0]);
  });
};

// Update user
exports.update = (req, res) => {
  const { displayName, role, avatarUrl, password } = req.body;
  const updateFields = [];
  const updateValues = [];
  if (displayName !== undefined) { updateFields.push('displayName=?'); updateValues.push(displayName); }
  if (role !== undefined) { updateFields.push('role=?'); updateValues.push(role); }
  if (avatarUrl !== undefined) { updateFields.push('avatarUrl=?'); updateValues.push(avatarUrl); }
  if (password) {
    const hashedPassword = bcrypt.hashSync(password, 10);
    updateFields.push('password=?');
    updateValues.push(hashedPassword);
  }
  if (updateFields.length === 0) return res.status(400).json({ message: 'No fields to update' });
  updateValues.push(req.params.id);
  db.query(`UPDATE users SET ${updateFields.join(', ')} WHERE id=?`,
    updateValues,
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Error updating user', error: err });
      db.query('SELECT * FROM users WHERE id=?', [req.params.id], (err2, results) => {
        if (err2) return res.status(500).json({ message: 'User updated but failed to fetch updated user', error: err2 });
        if (!results.length) return res.status(404).json({ message: 'User updated but not found' });
        res.json(results[0]);
      });
    });
};

// Delete user
exports.delete = (req, res) => {
  db.query('DELETE FROM users WHERE id=?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error deleting user', error: err });
    res.json({ message: 'User deleted' });
  });
};

// Create user
exports.create = (req, res) => {
  const { name, email, role, password, branchId, teamIds } = req.body;
  if (!name || !email || !role || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  // Check if email already exists
  db.query('SELECT id FROM users WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error checking email', error: err });
    if (results.length > 0) {
      return res.status(409).json({ message: 'Email already taken' });
    }
    // Hash password (for demo, use bcrypt in production)
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return res.status(500).json({ message: 'Error hashing password', error: err });
      db.query(
        'INSERT INTO users (displayName, email, role, password, branchId) VALUES (?, ?, ?, ?, ?)',
        [name, email, role, hash, branchId || null],
        (err, result) => {
          if (err) return res.status(500).json({ message: 'Error creating user', error: err });
          const userId = result.insertId;
          // Insert into user_teams if teamIds provided
          if (Array.isArray(teamIds) && teamIds.length > 0) {
            const values = teamIds.map(teamId => [userId, teamId]);
            db.query('INSERT INTO user_teams (userId, teamId) VALUES ?', [values], (err2) => {
              if (err2) return res.status(500).json({ message: 'User created but failed to assign teams', error: err2 });
              res.status(201).json({ id: userId, name, email, role, branchId, teamIds });
            });
          } else {
            res.status(201).json({ id: userId, name, email, role, branchId, teamIds: [] });
          }
        }
      );
    });
  });
};

// Upload avatar
exports.uploadAvatar = (req, res) => {
  console.log('Avatar upload request received:', req.file, req.params.id);
  if (!req.file) {
    console.error('No file uploaded');
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  // Read the file buffer and store in DB as BLOB
  const filePath = req.file.path;
  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error('Error reading uploaded file:', err);
      return res.status(500).json({ success: false, message: 'Error reading uploaded file', error: err });
    }
    db.query('UPDATE users SET avatar=?, avatarMimeType=?, avatarUrl=NULL WHERE id=?', [data, req.file.mimetype, req.params.id], (err) => {
      if (err) {
        console.error('Error saving avatar to DB:', err);
        return res.status(500).json({ success: false, message: 'Error saving avatar', error: err });
      }
      // Optionally, delete the file from disk after storing in DB
      fs.unlink(filePath, () => {});
      console.log('Avatar uploaded and stored in DB for user:', req.params.id);
      res.json({ success: true, data: { avatarUrl: `/api/users/${req.params.id}/avatar?${Date.now()}` } });
    });
  });
};

// Get current user (for /me endpoint)
exports.getMe = (req, res) => {
  // Assume user ID is set by auth middleware (e.g., req.user.id)
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });
  db.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: { user: results[0] } });
  });
};

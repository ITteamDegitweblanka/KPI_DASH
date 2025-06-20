const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { email, password, displayName, role, team } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  const hash = await bcrypt.hash(password, 10);
  db.query('INSERT INTO users (email, password, displayName, role, team) VALUES (?, ?, ?, ?, ?)',
    [email, hash, displayName, role || 'Staff', team],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Registration failed', error: err });
      res.status(201).json({ id: result.insertId, email, displayName, role, team });
    });
};

exports.login = (req, res) => {
  console.log('Received login POST:', req.body); // Debug: log received body
  const { email, password } = req.body;
  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    console.log('Login attempt:', email, results); // Debug: log email and DB results
    if (err || results.length === 0) return res.status(401).json({ message: 'Invalid credentials' });
    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    console.log('Password match:', match); // Debug: log password match result
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    const refreshToken = jwt.sign({ id: user.id, type: 'refresh' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      refreshToken,
      expiresIn: 86400,
      user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role, team: user.team }
    });
  });
};

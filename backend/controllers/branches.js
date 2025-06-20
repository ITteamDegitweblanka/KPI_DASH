const db = require('../config/db');

exports.getAll = (req, res) => {
  db.query('SELECT * FROM branches', (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching branches', error: err });
    res.json(results);
  });
};

exports.getById = (req, res) => {
  db.query('SELECT * FROM branches WHERE id = ?', [req.params.id], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ message: 'Branch not found' });
    res.json(results[0]);
  });
};

exports.create = (req, res) => {
  console.log('[branches.create] req.body:', req.body); // Debug log
  const { name, location, employeeCount } = req.body;
  db.query(
    'INSERT INTO branches (name, location, employeeCount) VALUES (?, ?, ?)',
    [name, location || null, employeeCount || 0],
    (err, result) => {
      if (err) {
        console.error('[branches.create] SQL error:', err); // Debug log
        return res.status(500).json({ message: 'Error creating branch', error: err });
      }
      res.status(201).json({
        id: result.insertId,
        name,
        location: location || null,
        employeeCount: employeeCount || 0
      });
    }
  );
};

exports.update = (req, res) => {
  console.log('[branches.update] req.body:', req.body); // Debug log
  const { name, location, employeeCount } = req.body;
  db.query(
    'UPDATE branches SET name=?, location=?, employeeCount=? WHERE id=?',
    [name, location || null, employeeCount || 0, req.params.id],
    (err, result) => {
      if (err) {
        console.error('[branches.update] SQL error:', err); // Debug log
        return res.status(500).json({ message: 'Error updating branch', error: err });
      }
      res.json({ message: 'Branch updated' });
    }
  );
};

exports.delete = (req, res) => {
  db.query('DELETE FROM branches WHERE id=?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error deleting branch', error: err });
    res.json({ message: 'Branch deleted' });
  });
};

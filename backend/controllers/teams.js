const db = require('../config/db');

exports.getAll = (req, res) => {
  db.query('SELECT * FROM teams', (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching teams', error: err });
    res.json(results);
  });
};

exports.getById = (req, res) => {
  db.query('SELECT * FROM teams WHERE id = ?', [req.params.id], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ message: 'Team not found' });
    res.json(results[0]);
  });
};

exports.create = (req, res) => {
  console.log('[teamsController] Full req.body:', req.body); // Log the full request body
  const { name, description, branchId } = req.body;
  const desc = typeof description === 'string' && description.trim() !== '' ? description : 'N/A';
  const branch = branchId && !isNaN(parseInt(branchId, 10)) ? parseInt(branchId, 10) : null;
  console.log('[teamsController] Inserting:', { name, desc, branch });
  db.query(
    'INSERT INTO teams (name, description, branchId) VALUES (?, ?, ?)',
    [name, desc, branch],
    (err, result) => {
      if (err) {
        console.error('[teamsController] Error creating team:', err);
        return res.status(500).json({ message: 'Error creating team', error: err });
      }
      res.status(201).json({
        id: result.insertId,
        name,
        description: desc,
        branchId: branch
      });
    }
  );
};

exports.update = (req, res) => {
  const { name } = req.body;
  db.query('UPDATE teams SET name=? WHERE id=?', [name, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error updating team', error: err });
    res.json({ message: 'Team updated' });
  });
};

exports.delete = (req, res) => {
  db.query('DELETE FROM teams WHERE id=?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error deleting team', error: err });
    res.json({ message: 'Team deleted' });
  });
};

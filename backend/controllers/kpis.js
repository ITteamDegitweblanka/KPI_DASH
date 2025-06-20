const db = require('../config/db');

exports.getAll = (req, res) => {
  db.query('SELECT * FROM kpis', (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching KPIs', error: err });
    res.json(results);
  });
};

exports.getById = (req, res) => {
  db.query('SELECT * FROM kpis WHERE id = ?', [req.params.id], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ message: 'KPI not found' });
    res.json(results[0]);
  });
};

exports.create = (req, res) => {
  const { employeeId, metric, value, recordedAt } = req.body;
  db.query('INSERT INTO kpis (employeeId, metric, value, recordedAt) VALUES (?, ?, ?, ?)', [employeeId, metric, value, recordedAt], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error creating KPI', error: err });
    res.status(201).json({ id: result.insertId });
  });
};

exports.update = (req, res) => {
  const { metric, value, recordedAt } = req.body;
  db.query('UPDATE kpis SET metric=?, value=?, recordedAt=? WHERE id=?', [metric, value, recordedAt, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error updating KPI', error: err });
    res.json({ message: 'KPI updated' });
  });
};

exports.delete = (req, res) => {
  db.query('DELETE FROM kpis WHERE id=?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error deleting KPI', error: err });
    res.json({ message: 'KPI deleted' });
  });
};

exports.getByTeam = (req, res) => {
  const teamId = req.params.teamId;
  // Join users and kpis to get KPIs for all users in the team
  const sql = `
    SELECT kpis.*, users.team AS teamName, users.displayName AS userName
    FROM kpis
    JOIN users ON kpis.employeeId = users.id
    WHERE users.team = ?
  `;
  db.query(sql, [teamId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching team KPIs', error: err });
    if (!results.length) return res.status(404).json({ message: 'No KPIs found for this team' });
    res.json(results);
  });
};

// Get KPIs grouped by team (all teams or specific team if teamId is provided)
exports.getByAllTeams = (req, res) => {
  const { teamId } = req.query;
  let sql;
  let params = [];
  if (teamId) {
    sql = `
      SELECT users.team AS teamName, users.id AS userId, users.displayName AS userName, kpis.*
      FROM kpis
      JOIN users ON kpis.employeeId = users.id
      WHERE users.team = ?
      ORDER BY users.team, users.displayName
    `;
    params = [teamId];
  } else {
    sql = `
      SELECT users.team AS teamName, users.id AS userId, users.displayName AS userName, kpis.*
      FROM kpis
      JOIN users ON kpis.employeeId = users.id
      ORDER BY users.team, users.displayName
    `;
  }
  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching KPIs by team', error: err });
    if (teamId && !results.length) return res.status(404).json({ message: 'No KPIs found for this team' });
    res.json(results);
  });
};

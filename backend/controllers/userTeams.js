const db = require('../config/db');

// Remove all logic from userTeams controller (feature disabled)

// Assign a user to a team (add row to user_teams)
exports.assignUserToTeam = (req, res) => {
  res.status(403).json({ message: 'User-team assignment is disabled' });
};

// Remove a user from a team
exports.removeUserFromTeam = (req, res) => {
  res.status(403).json({ message: 'User-team assignment is disabled' });
};

// Get all teams for a user
exports.getTeamsForUser = (req, res) => {
  res.status(403).json({ message: 'User-team assignment is disabled' });
};

// Get all users for a team
exports.getUsersForTeam = (req, res) => {
  res.status(403).json({ message: 'User-team assignment is disabled' });
};

// Fetch users by branch
exports.getUsersByBranch = (req, res) => {
  const branchId = req.params.branchId;
  if (!branchId) return res.status(400).json({ message: 'branchId required' });
  db.query('SELECT * FROM users WHERE branchId = ?', [branchId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching users by branch', error: err });
    res.json(results);
  });
};

// Get all user-team assignments (user name + all teams)
exports.getAllUserTeamAssignments = (req, res) => {
  console.log('[getAllUserTeamAssignments] Request headers:', req.headers);
  const sql = `
    SELECT u.id as userId, u.displayName as userName, t.id as teamId, t.name as teamName
    FROM user_teams ut
    JOIN users u ON ut.userId = u.id
    JOIN teams t ON ut.teamId = t.id
    ORDER BY u.displayName, t.name
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error('[getAllUserTeamAssignments] SQL error:', err);
      return res.status(500).json({ message: 'Error fetching user-team assignments', error: err });
    }
    console.log('[getAllUserTeamAssignments] Results:', results);
    res.json(results);
  });
};

// Assign a user to teams (replace all assignments)
exports.assignUserToTeams = (req, res) => {
  const { userId, teamIds } = req.body;
  if (!userId || !Array.isArray(teamIds)) {
    return res.status(400).json({ message: 'userId and teamIds[] required' });
  }
  // Remove all current assignments
  db.query('DELETE FROM user_teams WHERE userId = ?', [userId], (err) => {
    if (err) return res.status(500).json({ message: 'Error removing old assignments', error: err });
    if (teamIds.length === 0) return res.json({ message: 'Assignments cleared' });
    // Add new assignments
    const values = teamIds.map(teamId => [userId, teamId]);
    db.query('INSERT INTO user_teams (userId, teamId) VALUES ?', [values], (err2) => {
      if (err2) return res.status(500).json({ message: 'Error assigning teams', error: err2 });
      res.json({ message: 'Teams assigned' });
    });
  });
};

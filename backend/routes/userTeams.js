const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const userTeamsController = require('../controllers/userTeams');

// Apply JWT auth to all user-teams routes
router.use(authMiddleware);

// Assign teams to a user (replace all assignments)
router.post('/assign', userTeamsController.assignUserToTeams);

// Get all user-team assignments (user name + all teams)
router.get('/assignments', userTeamsController.getAllUserTeamAssignments);

module.exports = router;

const express = require('express');
const router = express.Router();
const goalsController = require('../controllers/goals');

// Get all goals for a specific employee
router.get('/employee/:employeeId', goalsController.getGoalsByEmployeeId);

router.get('/', goalsController.getAll);
router.get('/:id', goalsController.getById);
router.post('/', goalsController.create);
router.put('/:id', goalsController.update);
router.delete('/:id', goalsController.delete);

module.exports = router;

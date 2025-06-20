const express = require('express');
const router = express.Router();
const teamsController = require('../controllers/teams');

router.get('/', teamsController.getAll);
router.get('/:id', teamsController.getById);
router.post('/', teamsController.create);
router.put('/:id', teamsController.update);
router.delete('/:id', teamsController.delete);

module.exports = router;

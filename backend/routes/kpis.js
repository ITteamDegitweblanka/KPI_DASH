const express = require('express');
const router = express.Router();
const kpisController = require('../controllers/kpis');

router.get('/', kpisController.getAll);
router.get('/:id', kpisController.getById);
router.post('/', kpisController.create);
router.put('/:id', kpisController.update);
router.delete('/:id', kpisController.delete);
router.get('/team/:teamId', kpisController.getByTeam);
router.get('/team', kpisController.getByAllTeams);

module.exports = router;

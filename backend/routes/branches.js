const express = require('express');
const router = express.Router();
const branchesController = require('../controllers/branches');

router.get('/', branchesController.getAll);
router.get('/:id', branchesController.getById);
router.post('/', branchesController.create);
router.put('/:id', branchesController.update);
router.delete('/:id', branchesController.delete);

module.exports = router;

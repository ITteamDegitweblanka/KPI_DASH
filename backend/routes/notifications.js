const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notifications');

router.get('/', notificationsController.getAll);
router.get('/:id', notificationsController.getById);
router.post('/', notificationsController.create);
router.put('/:id/read', notificationsController.markAsRead);
router.delete('/:id', notificationsController.delete);
router.get('/user/:userId', notificationsController.getByUserId);
router.put('/user/:userId/read-all', notificationsController.markAllAsRead);
router.delete('/user/:userId', notificationsController.clearAll);

module.exports = router;

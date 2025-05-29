const express = require('express');
const merchantController = require('../controllers/merchantController.js');
const authenticate = require('../middlewares/authenticate.js');
const router = express.Router();


router.get('/all',authenticate,merchantController.getUsers);
router.get('/notifications',authenticate,merchantController.getUserNotifications);
router.put('/markAsRead',authenticate,merchantController.markNotificationsAsRead);
router.delete('/notifications/:id',authenticate,merchantController.deleteNotification);

module.exports = router;

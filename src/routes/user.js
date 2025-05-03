const express = require('express');
const authController = require('../controllers/auth.js');
const authenticate = require('../middlewares/authenticate.js');
const router = express.Router();


router.get('/all',authenticate,authController.getUsers);
router.get('/notifications',authenticate,authController.getUserNotifications);
router.put('/markAsRead',authenticate,authController.markNotificationsAsRead);
router.delete('/notifications/:id',authenticate,authController.deleteNotification);

module.exports = router;

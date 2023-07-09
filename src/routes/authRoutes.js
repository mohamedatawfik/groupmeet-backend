const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Routes for authentication
// router.get('/test', authController.test);
// router.get('/login', authController.login);
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

module.exports = router;

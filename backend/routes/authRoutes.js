const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// User registration and login routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Get user data route - Fix the route name to match the controller function
router.get('/getUserId', authController.getUserById);

// Admin routes
router.post('/registerAdmin', authController.registerAdmin);

module.exports = router; 
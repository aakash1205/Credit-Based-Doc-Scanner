const express = require('express');
const { manageCreditRequest, getAllUsers } = require('../controllers/adminController');
const { isAdmin } = require('../middleware/adminMiddleware'); // Import the admin middleware
const router = express.Router();

// Admin routes
router.put('/manage-credit-request', isAdmin, manageCreditRequest); // Protect with admin check
router.get('/users', isAdmin, getAllUsers); // Protect with admin check

module.exports = router; 
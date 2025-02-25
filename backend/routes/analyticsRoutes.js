const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// Remove the old route
// router.get('/user-activity', analyticsController.getUserActivity);

// Add these new routes
router.get('/dashboard', analyticsController.getDashboardStats);
router.get('/user/:userId', analyticsController.getUserAnalytics);

module.exports = router; 
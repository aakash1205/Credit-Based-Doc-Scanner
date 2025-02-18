const express = require('express');
const { getUserActivity } = require('../controllers/analyticsController');
const router = express.Router();

router.get('/userActivity', getUserActivity);

module.exports = router; 
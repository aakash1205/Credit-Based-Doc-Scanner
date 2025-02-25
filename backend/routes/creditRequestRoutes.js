const express = require('express');
const router = express.Router();
const creditRequestController = require('../controllers/creditRequestController');

// Route to get all credit requests
router.get('/', creditRequestController.getCreditRequests);

// Route to manage credit requests (approve/deny)
router.post('/manage/:requestId', creditRequestController.manageCreditRequest);

// Route to create a new credit request
router.post('/request', creditRequestController.createCreditRequest);

module.exports = router; 
const express = require('express');
const { submitCreditRequest, getAllCreditRequests, updateCreditRequest, requestAdditionalScans, adjustUserCredits } = require('../controllers/creditController');
const router = express.Router();

router.post('/request', submitCreditRequest);
router.post('/request-additional-scans', requestAdditionalScans);
router.get('/', getAllCreditRequests);
router.put('/update', updateCreditRequest);
router.put('/adjust', adjustUserCredits);

module.exports = router; 
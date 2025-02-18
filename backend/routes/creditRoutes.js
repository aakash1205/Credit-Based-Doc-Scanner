const express = require('express');
const { requestCredits } = require('../controllers/creditController');
const router = express.Router();

router.post('/request', requestCredits);

module.exports = router; 
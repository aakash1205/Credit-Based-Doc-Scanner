const express = require('express');
const { scanDocument, getMatches } = require('../controllers/documentController');
const router = express.Router();

router.post('/scanUpload', scanDocument);
router.get('/matches/:docId', getMatches);

module.exports = router; 
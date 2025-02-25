const express = require('express');
const { 
    scanDocument, 
    getMatches, 
    getUserDocuments, 
    exportUserHistory,
    getDocumentById
} = require('../controllers/documentController');
const router = express.Router();

// Specific routes first
router.post('/scanUpload', scanDocument);
router.get('/matches/:docId', getMatches);
router.get('/user/:userId', getUserDocuments);
router.get('/export/:userId', exportUserHistory);

// Generic route last
// router.get('/:id', getDocumentById);  // This should be last

module.exports = router;
const Document = require('../models/documentModel');
const User = require('../models/userModel');
const { basicSimilarity } = require('../utils/similarity');

// Upload and scan document
exports.scanDocument = async (req, res) => {
    const { userId, fileContent } = req.body;
    const user = await User.findById(userId);
    
    if (user.credits > 0) {
        const newDocument = new Document({ content: fileContent, userId });
        await newDocument.save();
        user.credits -= 1; // Deduct credit
        await user.save();
        res.json({ message: 'Document scanned successfully' });
    } else {
        res.status(403).json({ message: 'Insufficient credits' });
    }
};

// Get matching documents
exports.getMatches = async (req, res) => {
    const { docId } = req.params;
    const document = await Document.findById(docId);
    const allDocuments = await Document.find();
    const matches = allDocuments.filter(doc => basicSimilarity(document.content, doc.content) > 0.7);
    res.json(matches);
}; 
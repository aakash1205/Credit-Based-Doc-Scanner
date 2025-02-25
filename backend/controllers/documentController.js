const Document = require('../models/documentModel');
const User = require('../models/userModel');
const { cosineSimilarity } = require('../utils/similarity');
const Analytics = require('../models/analyticsModel');
const db = require('../database');

// Upload and scan document
exports.scanDocument = async (req, res) => {
    const { userId, fileContent } = req.body;
    
    console.log('Scanning document for user:', userId);
    console.log('File content length:', fileContent?.length);

    if (!userId || !fileContent) {
        console.error('Missing required fields:', { userId, hasContent: !!fileContent });
        return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check user credits first
    const user = await User.findById(userId);
    console.log('User found:', user);

    if (!user) {
        console.error('User not found:', userId);
        return res.status(404).json({ message: 'User not found' });
    }

    if (user.daily_credits_used >= user.max_daily_credits) {
        console.log('Credit limit reached:', {
            used: user.daily_credits_used,
            max: user.max_daily_credits
        });
        return res.status(403).json({ 
            message: 'Daily credit limit reached',
            dailyCreditsUsed: user.daily_credits_used,
            maxDailyCredits: user.max_daily_credits
        });
    }

    // Process the document
    console.log('Creating document for user:', userId);
    const docId = await Document.create({
        content: fileContent,
        userId: userId
    });
    console.log('Document created with ID:', docId);

    // Update user credits
    const updatedUser = await User.incrementCredits(userId);
    console.log('User credits updated:', updatedUser);

    // Send response
    res.json({
        success: true,
        message: 'Document scanned successfully',
        docId: docId,
        dailyCreditsUsed: updatedUser.daily_credits_used,
        maxDailyCredits: updatedUser.max_daily_credits
    });
};

// Get matching documents
exports.getMatches = async (req, res) => {
    try {
        const { docId } = req.params;
        console.log('Finding matches for document:', docId);

        // Get the source document
        const sourceDoc = await Document.getDocumentById(docId);
        if (!sourceDoc) {
            console.log('Source document not found:', docId);
            return res.status(404).json({ message: 'Document not found' });
        }
        console.log('Source document found:', { id: sourceDoc.id, contentLength: sourceDoc.content?.length });

        // Get all documents
        const allDocuments = await Document.getAllDocuments();
        console.log('Total documents found:', allDocuments.length);

        // Filter out the source document and calculate similarity
        const matches = allDocuments
            .filter(doc => doc.id !== sourceDoc.id) // Exclude the source document
            .map(doc => {
                const similarity = cosineSimilarity(sourceDoc.content || '', doc.content || '');
                return {
                    id: doc.id,
                    createdAt: doc.createdAt,
                    similarity: similarity
                };
            })
            .filter(doc => doc.similarity > 0.5) // Adjust threshold as needed
            .sort((a, b) => b.similarity - a.similarity); // Sort by similarity

        console.log('Found matches:', matches.length);
        console.log('Match details:', matches);

        res.json({
            success: true,
            matches: matches.map(match => ({
                id: match.id,
                similarity: Math.round(match.similarity * 100) + '%',
                createdAt: match.createdAt
            }))
        });

    } catch (error) {
        console.error('Error finding matches:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error finding matches',
            error: error.message 
        });
    }
};

// Get documents for a specific user
exports.getUserDocuments = async (req, res) => {
    const { userId } = req.params;
    
    try {
        console.log('Fetching documents for user:', userId); // Debug log
        const documents = await Document.getDocumentsByUserId(userId);
        console.log('Found documents:', documents); // Debug log
        res.json(documents);
    } catch (err) {
        console.error('Error fetching user documents:', err);
        res.status(500).json({ 
            message: 'Error fetching documents',
            error: err.message 
        });
    }
};

exports.exportUserHistory = async (req, res) => {
    const { userId } = req.params;
    
    try {
        // Get user info
        const user = await User.getUserById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get all documents for this user
        const documents = await Document.getDocumentsByUserId(userId);
        
        // Format the report
        const report = {
            username: user.username,
            exportDate: new Date().toLocaleString(),
            totalDocuments: documents.length,
            documents: documents.map(doc => ({
                id: doc.id,
                uploadDate: new Date(doc.createdAt).toLocaleString(),
                content: doc.content.substring(0, 100) + '...', // First 100 chars
                matches: doc.matches || 0
            }))
        };

        // Convert to text format
        const textReport = `
SCAN HISTORY REPORT
User: ${report.username}
Export Date: ${report.exportDate}
Total Documents: ${report.totalDocuments}

DOCUMENT DETAILS:
${report.documents.map(doc => `
Document ID: ${doc.id}
Upload Date: ${doc.uploadDate}
Content Preview: ${doc.content}
Number of Matches: ${doc.matches}
-------------------`).join('\n')}
        `.trim();

        // Set headers for file download
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename=scan_history_${user.username}_${Date.now()}.txt`);
        
        // Send the report
        res.send(textReport);

    } catch (err) {
        console.error('Error generating export:', err);
        res.status(500).json({ message: 'Error generating export' });
    }
}; 
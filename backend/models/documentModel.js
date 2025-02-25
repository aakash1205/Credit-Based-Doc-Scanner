const db = require('../database');
const Analytics = require('./analyticsModel');

class Document {
    static async create({ content, userId }) {
        return new Promise((resolve, reject) => {
            console.log('Creating document for user:', userId);
            console.log('Content length:', content?.length);
            
            if (!content || !userId) {
                reject(new Error('Missing required fields'));
                return;
            }

            const topic = Analytics.analyzeDocumentTopic(content);
            const sql = `INSERT INTO documents (content, userId, topic, createdAt) VALUES (?, ?, ?, datetime('now'))`;
            
            try {
                db.run(sql, [content, userId, topic], function(err) {
                    if (err) {
                        console.error('Database error creating document:', err);
                        reject(err);
                        return;
                    }
                    console.log('Document created with ID:', this.lastID);
                    resolve(this.lastID);
                });
            } catch (error) {
                console.error('Error in database operation:', error);
                reject(error);
            }
        });
    }

    static async getDocumentsByUserId(userId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM documents WHERE userId = ? ORDER BY createdAt DESC';
            db.all(sql, [userId], (err, rows) => {
                if (err) {
                    console.error('Error fetching user documents:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    static async getDocumentById(id) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM documents WHERE id = ?';
            db.get(sql, [id], (err, row) => {
                if (err) {
                    console.error('Error getting document by id:', err);
                    reject(err);
                } else if (!row) {
                    reject(new Error('Document not found'));
                } else {
                    // Make sure content exists for similarity comparison
                    if (!row.content) {
                        row.content = ''; // Provide default empty content if none exists
                    }
                    resolve(row);
                }
            });
        });
    }

    static async getAllDocuments() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM documents';
            db.all(sql, [], (err, rows) => {
                if (err) {
                    console.error('Error getting all documents:', err);
                    reject(err);
                } else {
                    // Make sure each document has content for similarity comparison
                    rows = rows.map(row => ({
                        ...row,
                        content: row.content || '' // Provide default empty content if none exists
                    }));
                    resolve(rows);
                }
            });
        });
    }
}

module.exports = Document; 
const db = require('../database');

const CreditRequest = {
    // Create a new credit request
    createCreditRequest: (userId, requestedCredits, callback) => {
        // First try with createdAt column
        const sql = 'INSERT INTO credit_requests (userId, amount, status, createdAt) VALUES (?, ?, ?, ?)';
        const now = new Date().toISOString();
        
        db.run(sql, [userId, requestedCredits, 'pending', now], function(err) {
            if (err) {
                if (err.message.includes('no column named createdAt')) {
                    // If createdAt column doesn't exist, use old schema
                    const fallbackSql = 'INSERT INTO credit_requests (userId, amount, status) VALUES (?, ?, ?)';
                    db.run(fallbackSql, [userId, requestedCredits, 'pending'], function(fallbackErr) {
                        if (fallbackErr) {
                            console.error('Error creating credit request (fallback):', fallbackErr);
                            return callback(fallbackErr);
                        }
                        callback(null, this.lastID);
                    });
                } else {
                    console.error('Error creating credit request:', err);
                    return callback(err);
                }
            } else {
                callback(null, this.lastID);
            }
        });
    },

    // Get all credit requests
    getAllRequests: (callback) => {
        const sql = 'SELECT * FROM credit_requests ORDER BY id DESC';
        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error('Database error:', err);
                return callback(err);
            }
            console.log('Retrieved requests:', rows);
            callback(null, rows);
        });
    },

    // Update credit request status
    updateStatus: (requestId, status, callback) => {
        const sql = 'UPDATE credit_requests SET status = ? WHERE id = ?';
        db.run(sql, [status, requestId], callback);
    },

    // Delete a credit request
    deleteRequest: (requestId, callback) => {
        const sql = 'DELETE FROM credit_requests WHERE id = ?';
        db.run(sql, [requestId], callback);
    },

    // Get a credit request by ID
    getRequestById: (requestId) => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM credit_requests WHERE id = ?';
            db.get(sql, [requestId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }
};

module.exports = CreditRequest; 
const db = require('../database');

class User {
    static async register(username, password, isAdmin = 0) {
        return new Promise((resolve, reject) => {
            const sql = 'INSERT INTO users (username, password, isAdmin) VALUES (?, ?, ?)';
            db.run(sql, [username, password, isAdmin], function(err) {
                if (err) {
                    return reject(err);
                }
                resolve(this.lastID);
            });
        });
    }

    static async getUserByUsername(username) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM users WHERE username = ?';
            db.get(sql, [username], (err, row) => {
                if (err) {
                    console.error('Error getting user by username:', err);
                    return reject(err);
                }
                if (row) {
                    // Ensure default values for credit-related fields
                    row.dailyCreditsUsed = row.dailyCreditsUsed || 0;
                    row.maxDailyCredits = row.maxDailyCredits || 3;
                    row.lastCreditResetDate = row.lastCreditResetDate || '';
                }
                resolve(row);
            });
        });
    }

    static async findById(userId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM users WHERE id = ?';
            db.get(sql, [userId], (err, row) => {
                if (err) {
                    console.error('Error finding user:', err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    static async incrementCredits(userId) {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE users 
                SET dailyCreditsUsed = dailyCreditsUsed + 1 
                WHERE id = ?
            `;
            db.run(sql, [userId], function(err) {
                if (err) {
                    console.error('Error incrementing credits:', err);
                    reject(err);
                } else {
                    // Get updated user data
                    User.findById(userId)
                        .then(user => resolve(user))
                        .catch(err => reject(err));
                }
            });
        });
    }

    static async updateUser(id, updates) {
        return new Promise((resolve, reject) => {
            const { dailyCreditsUsed, lastCreditResetDate, maxDailyCredits } = updates;
            
            console.log('Updating user with ID:', id, 'Updates:', updates);
            
            const sql = `UPDATE users SET 
                         dailyCreditsUsed = ?, 
                         lastCreditResetDate = ?,
                         maxDailyCredits = ? 
                         WHERE id = ?`;
                         
            db.run(sql, [dailyCreditsUsed, lastCreditResetDate, maxDailyCredits, id], function(err) {
                if (err) {
                    console.error('Error updating user:', err);
                    reject(err);
                } else {
                    console.log('User updated successfully');
                    resolve();
                }
            });
        });
    }

    static async resetDailyCreditsIfNeeded(userId) {
        const currentDate = new Date().toISOString().split('T')[0];
        
        try {
            const user = await this.findById(userId);
            
            console.log('Checking credit reset:', {
                userId,
                currentDate,
                lastResetDate: user.lastCreditResetDate,
                currentCredits: user.dailyCreditsUsed
            });

            // Check if we need to reset daily credits
            if (!user.lastCreditResetDate || user.lastCreditResetDate !== currentDate) {
                console.log('Resetting credits for user:', userId);
                
                return new Promise((resolve, reject) => {
                    const sql = `
                        UPDATE users 
                        SET dailyCreditsUsed = 0,
                            lastCreditResetDate = ?
                        WHERE id = ?
                    `;
                    
                    db.run(sql, [currentDate, userId], function(err) {
                        if (err) {
                            console.error('Error resetting credits:', err);
                            reject(err);
                        } else {
                            resolve({
                                ...user,
                                dailyCreditsUsed: 0,
                                lastCreditResetDate: currentDate
                            });
                        }
                    });
                });
            }
            
            return user;
        } catch (error) {
            console.error('Error in resetDailyCreditsIfNeeded:', error);
            throw error;
        }
    }

    static getUserById(userId, callback) {
        const sql = 'SELECT * FROM users WHERE id = ?';
        db.get(sql, [userId], (err, row) => {
            if (err) {
                console.error('Error getting user by ID:', err);
                return callback(err, null);
            }
            callback(null, row);
        });
    }

    static updateCredits(userId, newCredits, callback) {
        const sql = 'UPDATE users SET credits = ? WHERE id = ?';
        db.run(sql, [newCredits, userId], (err) => {
            if (err) {
                console.error('Error updating user credits:', err);
                return callback(err);
            }
            callback(null);
        });
    }
}

module.exports = User; 
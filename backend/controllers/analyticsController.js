const Analytics = require('../models/analyticsModel');
const db = require('../database');

// Get user activity analytics
exports.getUserActivity = async (req, res) => {
    const users = await User.find();
    const activityData = users.map(user => ({
        username: user.username,
        scans: user.scans.length, // Assuming scans are stored in user model
        creditsUsed: 20 - user.credits // Calculate used credits
    }));
    res.json(activityData);
};

exports.getDashboardStats = async (req, res) => {
    try {
        // Get date range (default to last 30 days)
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            .toISOString().split('T')[0];

        // Add timeout to queries
        const timeout = 5000; // 5 seconds
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Query timeout')), timeout)
        );

        const statsPromise = Promise.all([
            getTopUsers(),
            getCreditStats(),
            getDailyScans(startDate, endDate),
            getDocumentTopics()
        ]);

        const [topUsers, creditStats, dailyScans, documentTopics] = 
            await Promise.race([statsPromise, timeoutPromise]);

        // Calculate total scans (which equals total credits used)
        const totalCreditsUsed = dailyScans.reduce((sum, day) => sum + day.count, 0);

        // Get today's statistics
        const todayStats = {
            totalScans: dailyScans[dailyScans.length - 1]?.count || 0,
            creditsUsed: totalCreditsUsed // Updated to use total scans
        };

        console.log('Analytics data:', {
            topUsers,
            creditStats,
            dailyScans,
            documentTopics,
            todayStats
        });

        res.json({
            topUsers: topUsers || [],
            creditStats: creditStats || [],
            dailyScans: dailyScans || [],
            documentTopics: documentTopics || [],
            todayStats,
            dateRange: { startDate, endDate }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(error.message === 'Query timeout' ? 504 : 500)
           .json({ 
               message: error.message === 'Query timeout' ? 
                   'Dashboard is currently experiencing high load' : 
                   'Error fetching analytics data'
           });
    }
};

// Helper function to get top users
function getTopUsers() {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                u.username,
                COUNT(d.id) as totalScans,
                MAX(d.createdAt) as lastScanDate,
                COUNT(CASE 
                    WHEN date(d.createdAt) = date('now') 
                    THEN 1 
                    ELSE NULL 
                END) as todayScans
            FROM users u
            LEFT JOIN documents d ON u.id = d.userId
            GROUP BY u.id, u.username
            ORDER BY totalScans DESC
            LIMIT 10
        `;
        
        db.all(sql, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

// Helper function to get credit statistics
function getCreditStats() {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                u.username,
                u.dailyCreditsUsed,
                COUNT(d.id) as totalDocuments
            FROM users u
            LEFT JOIN documents d ON u.id = d.userId
            GROUP BY u.id, u.username
            ORDER BY u.dailyCreditsUsed DESC
        `;
        
        db.all(sql, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

// Helper function to get daily scan statistics
function getDailyScans(startDate, endDate) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                date(createdAt) as date,
                COUNT(*) as count
            FROM documents
            WHERE date(createdAt) BETWEEN ? AND ?
            GROUP BY date(createdAt)
            ORDER BY date(createdAt)
        `;
        
        db.all(sql, [startDate, endDate], (err, rows) => {
            if (err) reject(err);
            else {
                // Fill in missing dates with zero counts
                const allDates = getDatesInRange(startDate, endDate);
                const scansMap = new Map(rows.map(row => [row.date, row.count]));
                
                const filledData = allDates.map(date => ({
                    date,
                    count: scansMap.get(date) || 0
                }));
                
                resolve(filledData);
            }
        });
    });
}

// Helper function to get document topics
function getDocumentTopics() {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                COALESCE(topic, 'Others') as name,
                COUNT(*) as count
            FROM documents
            GROUP BY topic
            ORDER BY count DESC
            LIMIT 5
        `;
        
        db.all(sql, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

// Helper function to get all dates in a range
function getDatesInRange(startDate, endDate) {
    const dates = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
}

exports.getUserAnalytics = async (req, res) => {
    try {
        const { userId } = req.params;
        const { startDate, endDate } = req.query;

        const stats = await getUserStats(userId, startDate, endDate);
        res.json(stats || []);
    } catch (error) {
        console.error('Error fetching user analytics:', error);
        res.status(500).json({ 
            message: 'Error fetching user analytics',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Helper function to get user statistics
function getUserStats(userId, startDate, endDate) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                date(d.createdAt) as date,
                COUNT(*) as scans,
                COUNT(DISTINCT d.topic) as uniqueTopics
            FROM documents d
            WHERE d.userId = ?
            AND date(d.createdAt) BETWEEN ? AND ?
            GROUP BY date(d.createdAt)
            ORDER BY date(d.createdAt)
        `;
        
        db.all(sql, [userId, startDate, endDate], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
} 
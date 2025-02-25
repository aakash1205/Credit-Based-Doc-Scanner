const db = require('../database');

const Analytics = {
    recordScan: async (userId, documentContent) => {
        const date = new Date().toISOString().split('T')[0];
        const sql = `INSERT INTO scan_analytics (userId, scanDate, documentLength) VALUES (?, ?, ?)`;
        return runQuery(sql, [userId, date, documentContent.length]);
    },

    getUserStats: async (userId, startDate, endDate) => {
        const sql = `
            SELECT scanDate, COUNT(*) AS scanCount, AVG(documentLength) AS avgDocumentLength
            FROM scan_analytics
            WHERE userId = ? AND scanDate BETWEEN ? AND ?
            GROUP BY scanDate
            ORDER BY scanDate DESC`;
        return getQuery(sql, [userId, startDate, endDate]);
    },

    getTopUsers: async (limit = 10) => {
        const sql = `
            SELECT u.username, COUNT(d.id) AS totalScans, MAX(d.createdAt) AS lastScanDate,
                COUNT(CASE WHEN date(d.createdAt) = date('now') THEN 1 ELSE NULL END) AS todayScans
            FROM users u
            LEFT JOIN documents d ON u.id = d.userId
            WHERE COALESCE(u.isAdmin, 0) = 0
            GROUP BY u.id, u.username
            HAVING COUNT(d.id) > 0
            ORDER BY totalScans DESC
            LIMIT ?`;
        return getQuery(sql, [limit]);
    },

    getCreditStats: async () => {
        const sql = `
            SELECT u.username, u.dailyCreditsUsed, COUNT(d.id) AS totalDocuments
            FROM users u
            LEFT JOIN documents d ON u.id = d.userId
            WHERE COALESCE(u.isAdmin, 0) = 0 AND u.dailyCreditsUsed > 0
            GROUP BY u.id, u.username
            ORDER BY u.dailyCreditsUsed DESC`;
        return getQuery(sql);
    },

    getDailyScans: async (startDate, endDate) => {
        const sql = `
            SELECT date(d.createdAt) AS date, COUNT(*) AS count
            FROM documents d
            JOIN users u ON d.userId = u.id
            WHERE u.isAdmin = 0 AND date(d.createdAt) BETWEEN ? AND ?
            GROUP BY date(d.createdAt)
            ORDER BY date(d.createdAt)`;

        const rows = await getQuery(sql, [startDate, endDate]);

        const allDates = getDatesInRange(startDate, endDate);
        const scansMap = new Map(rows.map(row => [row.date, row.count]));

        return allDates.map(date => ({ date, count: scansMap.get(date) || 0 }));
    },

    getDocumentTopics: async () => {
        if (topicsCache.data && Date.now() - topicsCache.timestamp < topicsCache.TTL) {
            return topicsCache.data;
        }

        const sql = `
            SELECT COALESCE(d.topic, 'Others') AS name, COUNT(*) AS count
            FROM documents d
            JOIN users u ON d.userId = u.id
            WHERE u.isAdmin = 0
            GROUP BY d.topic
            ORDER BY count DESC
            LIMIT 5`;

        const rows = await getQuery(sql);
        topicsCache.data = rows.length ? rows : [{ name: 'No Documents', count: 0 }];
        topicsCache.timestamp = Date.now();

        return topicsCache.data;
    },

    analyzeDocumentTopic: (content) => {
        const topicKeywords = {
            'Invoice': ['invoice', 'payment', 'bill', 'due date', 'total', 'tax'],
            'Contract': ['agreement', 'contract', 'terms', 'parties', 'clause', 'liability'],
            'Report': ['report', 'analysis', 'findings', 'summary', 'conclusion', 'data'],
            'Letter': ['dear', 'sincerely', 'regards', 'attention', 'reference'],
            'Resume/CV': ['resume', 'cv', 'experience', 'education', 'skills', 'qualification'],
            'Financial': ['financial', 'balance', 'statement', 'profit', 'loss', 'revenue'],
            'Technical': ['technical', 'requirements', 'documentation', 'installation', 'architecture'],
            'Legal': ['legal', 'law', 'compliance', 'court', 'petition', 'judgment'],
        };

        const lowerContent = content.toLowerCase();
        const topicScores = Object.entries(topicKeywords).map(([topic, keywords]) => {
            const exactMatches = keywords.reduce((count, keyword) => 
                count + (new RegExp(`\\b${keyword}\\b`, 'i').test(lowerContent) ? 2 : 0), 0);

            const partialMatches = keywords.reduce((count, keyword) => 
                count + (lowerContent.includes(keyword) ? 1 : 0), 0);

            const score = exactMatches + partialMatches;
            return { topic, score, confidence: score / (keywords.length * 2) };
        });

        const bestMatch = topicScores.sort((a, b) => b.score - a.score)[0];
        return bestMatch.confidence > 0.1 ? bestMatch.topic : 'Others';
    }
};

// Helper function for executing queries
const getQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
    });
};

const runQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, (err) => err ? reject(err) : resolve());
    });
};

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

// Cache for document topics
let topicsCache = { data: null, timestamp: null, TTL: 5 * 60 * 1000 };

module.exports = Analytics;

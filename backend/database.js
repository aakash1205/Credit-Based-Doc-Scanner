const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create a new database file
const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'), (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
    } else {
        console.log('Connected to SQLite database');
    }
});

// Create tables if they don't exist
db.serialize(() => {
    console.log('Ensuring tables exist...');
    
    // Create users table with new credit system
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        isAdmin INTEGER DEFAULT 0,
        dailyCreditsUsed INTEGER DEFAULT 0,
        lastCreditResetDate TEXT DEFAULT '',
        maxDailyCredits INTEGER DEFAULT 3
    )`, (err) => {
        if (err) {
            console.error('Error creating users table:', err.message);
        } else {
            console.log('Users table ready');
        }
    });

    // Create documents table with topic column
    db.run(`CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT,
        userId INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        topic TEXT DEFAULT 'Others',
        FOREIGN KEY (userId) REFERENCES users(id)
    )`, (err) => {
        if (err) {
            console.error('Error creating documents table:', err.message);
        } else {
            console.log('Documents table ready');
        }
    });

    // Create credit_requests table
    db.run(`CREATE TABLE IF NOT EXISTS credit_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        amount INTEGER,
        status TEXT DEFAULT 'pending',
        FOREIGN KEY (userId) REFERENCES users(id)
    )`, (err) => {
        if (err) {
            console.error('Error creating credit_requests table:', err.message);
        } else {
            console.log('Credit requests table ready');
        }
    });

    // Create scan_analytics table
    db.run(`CREATE TABLE IF NOT EXISTS scan_analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        scanDate TEXT,
        documentLength INTEGER,
        FOREIGN KEY (userId) REFERENCES users(id)
    )`, (err) => {
        if (err) {
            console.error('Error creating scan_analytics table:', err.message);
        } else {
            console.log('Scan analytics table ready');
        }
    });

    // Add indexes for better performance
    db.run(`CREATE INDEX IF NOT EXISTS idx_documents_userid 
            ON documents(userId)`, err => {
        if (err) console.error('Error creating document index:', err);
    });

    db.run(`CREATE INDEX IF NOT EXISTS idx_documents_createdat 
            ON documents(createdAt)`, err => {
        if (err) console.error('Error creating date index:', err);
    });

    db.run(`CREATE INDEX IF NOT EXISTS idx_documents_topic 
            ON documents(topic)`, err => {
        if (err) console.error('Error creating topic index:', err);
    });
});

// Add this function to your database.js
function initDatabase() {
    db.run(`
        CREATE TABLE IF NOT EXISTS credit_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER NOT NULL,
            amount INTEGER NOT NULL,
            status TEXT DEFAULT 'pending',
            createdAt TEXT NOT NULL,
            FOREIGN KEY (userId) REFERENCES users(id)
        )
    `, (err) => {
        if (err) {
            console.error('Error creating credit_requests table:', err);
            return;
        }
        
        // Add createdAt column if it doesn't exist
        db.run(`
            ALTER TABLE credit_requests 
            ADD COLUMN createdAt TEXT
        `, (alterErr) => {
            // Ignore error if column already exists
            if (alterErr && !alterErr.message.includes('duplicate column name')) {
                console.error('Error adding createdAt column:', alterErr);
            }
        });
    });
}

// Call this function when your application starts
initDatabase();

module.exports = db;
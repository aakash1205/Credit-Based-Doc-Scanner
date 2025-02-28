const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the SQLite database
const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'), (err) => {
    if (err) {
        console.error('Error opening database ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Query users and documents
db.serialize(() => {
    console.log('Users:');
    db.all('SELECT * FROM users', [], (err, rows) => {
        if (err) {
            throw err;
        }
        rows.forEach((row) => {
            console.log(row);
        });
    });

    console.log('Documents:');
    db.all('SELECT * FROM documents', [], (err, rows) => {
        if (err) {
            throw err;
        }
        rows.forEach((row) => {
            console.log(row);
        });
    });
});

// Close the database connection
db.close((err) => {
    if (err) {
        console.error('Error closing database ' + err.message);
    } else {
        console.log('Database connection closed.');
    }
}); 
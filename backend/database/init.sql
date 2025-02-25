-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'completed'
);

-- Create document_contents table
CREATE TABLE IF NOT EXISTS document_contents (
    document_id INTEGER PRIMARY KEY REFERENCES documents(id),
    content TEXT NOT NULL
);

-- Create document_analytics table
CREATE TABLE IF NOT EXISTS document_analytics (
    document_id INTEGER PRIMARY KEY REFERENCES documents(id),
    topic VARCHAR(100),
    content_length INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create credit_requests table
CREATE TABLE IF NOT EXISTS credit_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    createdAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id)
); 
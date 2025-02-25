function basicSimilarity(doc1, doc2) {
    // Implement a basic similarity algorithm (e.g., Levenshtein distance)
    // For simplicity, return a random similarity score for now
    return Math.random(); // Replace with actual logic
}

function cosineSimilarity(doc1, doc2) {
    const words1 = doc1.split(' ');
    const words2 = doc2.split(' ');

    const allWords = [...new Set([...words1, ...words2])];
    const vector1 = new Array(allWords.length).fill(0);
    const vector2 = new Array(allWords.length).fill(0);

    words1.forEach(word => {
        const index = allWords.indexOf(word);
        if (index !== -1) vector1[index]++;
    });

    words2.forEach(word => {
        const index = allWords.indexOf(word);
        if (index !== -1) vector2[index]++;
    });

    const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
    const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));

    return dotProduct / (magnitude1 * magnitude2);
}

module.exports = { basicSimilarity, cosineSimilarity }; 
const db = require('../Config/db');

// Example: Message save karne ka function
const saveMessage = async (senderId, receiverId, message) => {
    try {
        const sql = "INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)";
        const [result] = await db.execute(sql, [senderId, receiverId, message]);
        return result.insertId;
    } catch (error) {
        console.error("Database Error:", error);
        throw error;
    }
};

// Example: Chat history fetch karne ka function
const getChatHistory = async (user1, user2) => {
    try {
        const sql = "SELECT * FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY created_at ASC";
        const [rows] = await db.execute(sql, [user1, user2, user2, user1]);
        return rows;
    } catch (error) {
        console.error("Query Error:", error);
        return [];
    }
};

module.exports = { saveMessage, getChatHistory };
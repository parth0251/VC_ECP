require('dotenv').config();
const { pool } = require('./db');

async function run() {
    try {
        await pool.query("ALTER TABLE configurations ADD COLUMN config_type VARCHAR(50) DEFAULT 'classic';");
        console.log("Column config_type added successfully.");
    } catch (err) {
        if (err.message.includes('already exists')) {
            console.log("Column config_type already exists.");
        } else {
            console.error("Error adding column:", err.message);
        }
    } finally {
        pool.end();
    }
}

run();

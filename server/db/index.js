const { Pool } = require('pg');
require('dotenv').config();

// Log the DB config being used (mask password)
console.log('--- DB Config ---');
console.log('  Host:', process.env.DB_HOST);
console.log('  Port:', process.env.DB_PORT);
console.log('  Database:', process.env.DB_NAME);
console.log('  User:', process.env.DB_USER);
console.log('  Password:', process.env.DB_PASSWORD ? '****' : '(not set)');
console.log('-----------------');

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    database: process.env.DB_NAME,
});

pool.on('error', (err) => {
    console.error('Unexpected DB pool error:', err);
});

// Test DB connection on startup
pool.query('SELECT NOW()')
    .then((res) => {
        console.log('✅ DB connected successfully at:', res.rows[0].now);
    })
    .catch((err) => {
        console.error('❌ DB connection FAILED:', err.message);
    });

/**
 * Execute a query against the database.
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<import('pg').QueryResult>}
 */
const query = (text, params) => pool.query(text, params);

/**
 * Get a client from the pool (for transactions).
 * @returns {Promise<import('pg').PoolClient>}
 */
const getClient = () => pool.connect();

module.exports = { pool, query, getClient };

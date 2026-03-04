/**
 * Database setup script.
 * Creates the schema and populates seed data.
 *
 * Usage: node db/setup.js
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function setup() {
    // First connect to the default 'postgres' database to create our DB if needed.
    const adminPool = new Pool({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10),
        database: 'postgres',
    });

    const dbName = process.env.DB_NAME || 'ecp_platform';

    try {
        // Check if database exists
        const dbCheck = await adminPool.query(
            `SELECT 1 FROM pg_database WHERE datname = $1`,
            [dbName]
        );

        if (dbCheck.rowCount === 0) {
            console.log(`Creating database "${dbName}"...`);
            await adminPool.query(`CREATE DATABASE ${dbName}`);
            console.log(`Database "${dbName}" created.`);
        } else {
            console.log(`Database "${dbName}" already exists.`);
        }
    } catch (err) {
        console.error('Error creating database:', err.message);
    } finally {
        await adminPool.end();
    }

    // Now connect to our database and run schema + seed
    const appPool = new Pool({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10),
        database: dbName,
    });

    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const seedPath = path.join(__dirname, 'seed.sql');

        const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
        const seedSql = fs.readFileSync(seedPath, 'utf-8');

        console.log('Running schema...');
        await appPool.query(schemaSql);
        console.log('Schema applied successfully.');

        console.log('Running seed data...');
        await appPool.query(seedSql);
        console.log('Seed data inserted successfully.');

        console.log('\n✅ Database setup complete!');
    } catch (err) {
        console.error('Error during setup:', err.message);
        process.exit(1);
    } finally {
        await appPool.end();
    }
}

setup();

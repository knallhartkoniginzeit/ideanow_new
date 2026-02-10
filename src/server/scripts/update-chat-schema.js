const { query } = require('../db');

async function updateSchema() {
    try {
        console.log('Adding is_pinned column to chat_sessions table...');

        // Add is_pinned column if it doesn't exist
        await query(`
            ALTER TABLE chat_sessions 
            ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
        `);

        console.log('Successfully added is_pinned column!');
        process.exit(0);
    } catch (error) {
        console.error('Error updating schema:', error);
        process.exit(1);
    }
}

updateSchema();

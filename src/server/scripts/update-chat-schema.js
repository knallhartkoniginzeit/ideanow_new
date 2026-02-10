const { query } = require('../../db');

async function updateSchema() {
    try {
        console.log('Adding is_pinned column to chat_sessions table...');

        // Add is_pinned column if it doesn't exist
        await query(`
            ALTER TABLE chat_sessions 
            ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
        `);

        console.log('Successfully added is_pinned column!');

        console.log('Adding metadata column to chat_messages table...');

        // Add metadata column if it doesn't exist
        await query(`
            ALTER TABLE chat_messages 
            ADD COLUMN IF NOT EXISTS metadata JSONB;
        `);

        console.log('Successfully added metadata column!');
        process.exit(0);
    } catch (error) {
        console.error('Error updating schema:', error);
        process.exit(1);
    }
}

updateSchema();

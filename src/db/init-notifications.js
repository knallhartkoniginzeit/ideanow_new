const { query } = require('./index');
const fs = require('fs');
const path = require('path');

async function createNotificationsTable() {
    try {
        console.log('📋 Creating notifications table...');

        const sqlPath = path.join(__dirname, 'create-notifications-table.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await query(sql);

        console.log('✅ Notifications table created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating notifications table:', error);
        process.exit(1);
    }
}

createNotificationsTable();

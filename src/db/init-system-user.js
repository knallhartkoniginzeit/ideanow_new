const { query } = require('./index');
const fs = require('fs');
const path = require('path');

async function createSystemUser() {
    try {
        const sqlPath = path.join(__dirname, 'create-system-user.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running SQL from:', sqlPath);
        await query(sql);
        console.log('✅ System user created successfully');
    } catch (error) {
        console.error('❌ Error creating system user:', error);
        process.exit(1);
    }
}

createSystemUser();

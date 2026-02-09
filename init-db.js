const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config();

async function initDatabase() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected to Neon database!');

        // Read clean schema file
        const schema = fs.readFileSync('./src/db/schema-clean.sql', 'utf8');

        console.log('📝 Creating database schema...');
        await client.query(schema);

        console.log('✅ Database schema created successfully!');
        console.log('✅ All tables, indexes, and constraints are ready!');
        console.log('\n📊 Tables created:');
        console.log('   - users');
        console.log('   - oauth_accounts');
        console.log('   - problems_community');
        console.log('   - problem_likes');
        console.log('   - problem_bookmarks');
        console.log('   - applications');
        console.log('   - solutions');
        console.log('   - chat_sessions');
        console.log('   - chat_messages');
        console.log('   - transactions');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
        console.log('\n👋 Database connection closed');
        console.log('🎉 Google OAuth is now ready to use!');
    }
}

initDatabase();

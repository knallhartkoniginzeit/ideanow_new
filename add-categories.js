const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config();

async function addCategories() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected to Neon database!');

        // Read categories SQL file
        const categoriesSQL = fs.readFileSync('./src/db/add-categories.sql', 'utf8');

        console.log('📝 Adding categories table and data...');
        await client.query(categoriesSQL);

        console.log('✅ Categories added successfully!');
        console.log('\n📊 Categories available:');
        console.log('   - Technology & Software');
        console.log('   - Business & Marketing');
        console.log('   - Design & Creative');
        console.log('   - Data & Analytics');
        console.log('   - Healthcare & Medical');
        console.log('   - Education & Learning');
        console.log('   - Finance & Fintech');
        console.log('   - E-commerce & Retail');
        console.log('   - Social Impact');
        console.log('   - IoT & Hardware');
        console.log('   - Gaming & Entertainment');
        console.log('   - Real Estate & Property');
        console.log('   - Transportation & Logistics');
        console.log('   - Agriculture & Food');
        console.log('   - Energy & Environment');
        console.log('   - Legal & Compliance');
        console.log('   - HR & Recruitment');
        console.log('   - Communication & Collaboration');
        console.log('   - Security & Privacy');
        console.log('   - Other');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
        console.log('\n👋 Database connection closed');
    }
}

addCategories();

const { query } = require('./index');

async function checkCount() {
    try {
        const result = await query(
            "SELECT COUNT(*) FROM problems_community WHERE user_id = '00000000-0000-0000-0000-000000000001'"
        );
        console.log('📊 Current count:', result.rows[0].count);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error checking count:', error);
        process.exit(1);
    }
}

checkCount();

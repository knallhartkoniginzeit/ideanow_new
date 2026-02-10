const { query } = require('./index');

async function cleanupSystemProblems() {
    try {
        console.log('🧹 Cleaning up system user problems...');
        // System user ID: 00000000-0000-0000-0000-000000000001
        const result = await query(
            "DELETE FROM problems_community WHERE user_id = '00000000-0000-0000-0000-000000000001'"
        );
        console.log(`✅ Deleted ${result.rowCount} problems created by system user.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error cleaning up:', error);
        process.exit(1);
    }
}

cleanupSystemProblems();

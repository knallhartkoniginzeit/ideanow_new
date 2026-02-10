const fs = require('fs');
const csv = require('csv-parser');
const { query } = require('../db');

// Import FYP Data (CSV) - Previous research problems
async function importFYPData() {
    console.log('📊 Importing FYP Data from CSV...');

    const problems = [];

    return new Promise((resolve, reject) => {
        fs.createReadStream('C:\\Users\\antop\\Downloads\\archive\\FYP Data.csv')
            .pipe(csv())
            .on('data', (row) => {
                problems.push({
                    title: row.title || 'Untitled Problem',
                    description: row.abstract || row.problem || 'No description provided.',
                    category: row.domain || 'Technology',
                    technologies: row.technologies ? row.technologies.split(',').map(t => t.trim()) : [],
                    year: row.Year || row.year,
                    source_url: row.source_url || null
                });
            })
            .on('end', async () => {
                console.log(`✅ Parsed ${problems.length} FYP problems`);

                try {
                    let inserted = 0;
                    for (const problem of problems) {
                        await query(
                            `INSERT INTO problems_community 
                            (title, description, category, tags, budget, scale, status, user_id)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                            ON CONFLICT DO NOTHING`,
                            [
                                problem.title,
                                problem.description,
                                problem.category,
                                problem.technologies,
                                null, // budget
                                'large', // scale
                                'open',
                                '00000000-0000-0000-0000-000000000001' // system user UUID
                            ]
                        );
                        inserted++;
                        if (inserted % 100 === 0) {
                            console.log(`   Inserted ${inserted}/${problems.length}...`);
                        }
                    }
                    console.log(`✅ Imported ${inserted} FYP problems to database`);
                    resolve(inserted);
                } catch (error) {
                    console.error('❌ Error inserting FYP data:', error);
                    reject(error);
                }
            })
            .on('error', reject);
    });
}

// Import Current Problems (JSON) - Future ideas
async function importCurrentProblems() {
    console.log('📊 Importing Current Problems from JSON...');

    try {
        const data = JSON.parse(
            fs.readFileSync('C:\\Users\\antop\\Downloads\\deanow_1300_current_problems.json', 'utf8')
        );

        const problems = data.problems || data;
        console.log(`✅ Parsed ${problems.length} current problems`);

        let inserted = 0;
        for (const problem of problems) {
            await query(
                `INSERT INTO problems_community 
                (title, description, category, tags, budget, scale, status, user_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT DO NOTHING`,
                [
                    `${problem.domain}: ${problem.id}`,
                    problem.problem || 'No description',
                    problem.domain || 'General',
                    [problem.domain],
                    null,
                    'medium',
                    'open',
                    '00000000-0000-0000-0000-000000000001' // system user UUID
                ]
            );
            inserted++;
            if (inserted % 100 === 0) {
                console.log(`   Inserted ${inserted}/${problems.length}...`);
            }
        }
        console.log(`✅ Imported ${inserted} current problems to database`);
        return inserted;
    } catch (error) {
        console.error('❌ Error importing current problems:', error);
        throw error;
    }
}

// Main import function
async function importAllData() {
    console.log('🚀 Starting data import...\n');

    try {
        const fypCount = await importFYPData();
        console.log('');
        const currentCount = await importCurrentProblems();

        console.log('\n✅ Import Complete!');
        console.log(`   FYP Problems: ${fypCount}`);
        console.log(`   Current Problems: ${currentCount}`);
        console.log(`   Total: ${fypCount + currentCount}`);

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Import failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    importAllData();
}

module.exports = { importFYPData, importCurrentProblems, importAllData };

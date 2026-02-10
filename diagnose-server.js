const http = require('http');

async function check(url) {
    return new Promise((resolve) => {
        const req = http.get(url, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300, data: json });
                } catch (e) {
                    resolve({ status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300, data: data.substring(0, 100) });
                }
            });
        });
        req.on('error', (e) => resolve({ ok: false, error: e.message }));
    });
}

async function run() {
    console.log('Starting Diagnosis...');
    const baseUrl = 'http://localhost:3000/api';

    // 1. Check Trending
    console.log('\nChecking /problems/trending/list...');
    const trending = await check(`${baseUrl}/problems/trending/list`);
    console.log(`Status: ${trending.status}, OK: ${trending.ok}`);
    if (!trending.ok) console.error('Error:', trending.data || trending.error);

    // 2. List Problems
    console.log('\nChecking /problems...');
    const list = await check(`${baseUrl}/problems?limit=1`);
    console.log(`Status: ${list.status}, OK: ${list.ok}`);

    if (list.ok && list.data.problems && list.data.problems.length > 0) {
        const pid = list.data.problems[0].id;
        console.log(`\nFound Problem ID: ${pid}`);

        // 3. Check Detail
        console.log(`Checking /problems/${pid}...`);
        const detail = await check(`${baseUrl}/problems/${pid}`);
        console.log(`Status: ${detail.status}, OK: ${detail.ok}`);
        if (!detail.ok) console.error('Error:', detail.data || detail.error);

        // 4. Check "undefined" explicitly (should return 400 or 404, or 500)
        console.log(`\nChecking /problems/undefined (Expected fail)...`);
        const bad = await check(`${baseUrl}/problems/undefined`);
        console.log(`Status: ${bad.status} (This should be 404 or 500)`);
        console.log('Response:', bad.data);
    } else {
        console.log('No problems found to test detail view.');
    }
}

run();

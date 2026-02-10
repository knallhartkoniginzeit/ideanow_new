const http = require('http');

async function testFetch(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'GET',
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                console.log(`\nGET ${path} -> Status: ${res.statusCode}`);
                try {
                    const json = JSON.parse(data);
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    console.error('Failed to parse JSON:', data.substring(0, 200));
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', (e) => {
            console.error(`Problem with request: ${e.message}`);
            reject(e);
        });

        req.end();
    });
}

async function run() {
    try {
        console.log('--- Testing Problems API ---');

        // 1. Fetch List
        const listResult = await testFetch('/api/problems?limit=1');
        if (listResult.status !== 200) {
            console.error('Failed to list problems', listResult);
            return;
        }

        const problems = listResult.data.problems;
        if (!problems || problems.length === 0) {
            console.log('No problems found to test detail fetch.');
            return;
        }

        const problemId = problems[0].id;
        console.log(`Found problem ID: ${problemId}`);

        // 2. Fetch Detail
        const detailResult = await testFetch(`/api/problems/${problemId}`);
        if (detailResult.status === 200) {
            console.log('Successfully fetched problem detail!');
            console.log('Title:', detailResult.data.title);
        } else {
            console.error('Failed to fetch problem detail:', detailResult);
        }

        // 3. Fetch Trending
        console.log('\n--- Testing Trending API ---');
        const trendingResult = await testFetch('/api/problems/trending/list');
        if (trendingResult.status === 200) {
            console.log('Successfully fetched trending list!');
            console.log('Count:', trendingResult.data.trending?.length);
        } else {
            console.error('Failed to fetch trending list:', trendingResult);
        }

    } catch (error) {
        console.error('Test failed:', error);
    }
}

run();

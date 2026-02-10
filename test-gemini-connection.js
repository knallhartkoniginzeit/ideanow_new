const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testGemini() {
    console.log('🔑 Testing Gemini API...');

    if (!process.env.GEMINI_API_KEY) {
        console.error('❌ GEMINI_API_KEY is missing in .env');
        return;
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // List of models to try based on my verification
    const modelsToTry = [
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
        'gemini-flash-latest',
        'gemini-2.5-flash-lite'
    ];

    for (const modelName of modelsToTry) {
        console.log(`\n🤖 Testing Model: ${modelName}`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const prompt = "Hello";

            // Set a timeout for the request to avoid hanging
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            console.log(`✅ SUCCESS with ${modelName}! Response: ${text}`);
            console.log(`*** USE THIS MODEL NAME: ${modelName} ***`);
            return; // Stop after first success
        } catch (error) {
            let errorMsg = error.message.split('\n')[0]; // First line of error
            if (errorMsg.includes('404')) errorMsg = '404 Not Found (Invalid Model Name)';
            console.log(`❌ Failed with ${modelName}: ${errorMsg}`);
        }
    }
    console.log('\n❌ All models failed.');
}

testGemini();

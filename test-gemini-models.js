const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        console.log('🔍 Listing available Gemini models...\n');

        // Try to list models
        const models = await genAI.listModels();

        console.log('✅ Available models:');
        for await (const model of models) {
            console.log(`  - ${model.name}`);
            console.log(`    Display Name: ${model.displayName}`);
            console.log(`    Supported methods: ${model.supportedGenerationMethods.join(', ')}`);
            console.log('');
        }
    } catch (error) {
        console.error('❌ Error listing models:', error.message);
        console.log('\n💡 Trying common model names directly...\n');

        // Try common model names
        const modelsToTry = [
            'gemini-pro',
            'gemini-1.0-pro',
            'gemini-1.5-pro',
            'gemini-1.5-flash',
            'models/gemini-pro',
            'models/gemini-1.5-flash'
        ];

        for (const modelName of modelsToTry) {
            try {
                console.log(`Testing: ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent('Hello');
                const response = await result.response;
                console.log(`  ✅ ${modelName} WORKS!`);
                console.log(`  Response: ${response.text().substring(0, 50)}...\n`);
            } catch (err) {
                console.log(`  ❌ ${modelName} failed: ${err.message}\n`);
            }
        }
    }
}

listModels();

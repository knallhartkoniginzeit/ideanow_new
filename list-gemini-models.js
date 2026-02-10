const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listModels() {
    console.log('🔑 Listing Gemini Models...');

    if (!process.env.GEMINI_API_KEY) {
        console.error('❌ GEMINI_API_KEY is missing');
        return;
    }

    try {
        // We can't easily list models with the high-level SDK in a simple way without a model instance sometimes, 
        // but let's try to access the model manager if exposed, or just use a REST call which is more reliable for debugging.

        const apiKey = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log(`✅ Found ${data.models.length} models:`);
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
                    console.log(`   - ${m.name.replace('models/', '')}`);
                }
            });
        } else {
            console.error('❌ No models found or API error:', JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error('❌ Connection failed:', error);
    }
}

listModels();

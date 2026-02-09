const { GoogleGenerativeAI } = require('@google/generative-ai');
const { query } = require('../../db');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are an AI assistant for !deanow, a platform that helps users discover and refine niche problem statements. Your role is to:

1. Understand user's initial problem idea
2. Help them refine it into a more specific, actionable problem statement
3. Suggest related work, innovations, and improvements
4. Connect them with similar problems from our database

When a user provides a problem idea:
- Extract key concepts and domain
- Ask clarifying questions if the problem is too vague
- Provide a structured response with:
  * Refined problem statement
  * Related work summary (if found in database)
  * Innovation opportunities
  * Suggested improvements
  * Niche angle based on current trends

Always aim to make the problem more specific, actionable, and innovative.
Be encouraging and supportive while also being constructively critical to help them improve their idea.

Format your responses in markdown for better readability.`;

// Generate AI response using Gemini
async function generateResponse(userMessage, conversationHistory, searchResults) {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        // Build context from search results
        let contextFromSearch = '';
        if (searchResults.problems.length > 0) {
            contextFromSearch = `\n\nRelevant problems found in our database:\n`;
            searchResults.problems.slice(0, 3).forEach((p, i) => {
                contextFromSearch += `${i + 1}. "${p.title}" (${p.source}): ${p.description.substring(0, 150)}...\n`;
            });
        }

        // Build conversation history
        const historyMessages = conversationHistory.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
        }));

        // Start chat with history
        const chat = model.startChat({
            history: historyMessages,
            generationConfig: {
                maxOutputTokens: 2000,
                temperature: 0.7,
            },
        });

        // Send message with context
        const prompt = `${SYSTEM_PROMPT}\n${contextFromSearch}\n\nUser: ${userMessage}`;
        const result = await chat.sendMessage(prompt);
        const responseText = result.response.text();

        // Try to extract refined problem if present
        let refinedProblem = null;
        const refinedMatch = responseText.match(/\*\*Refined Problem Statement\*\*:?\s*([^\n]+)/i);
        if (refinedMatch) {
            refinedProblem = refinedMatch[1].trim();
        }

        // Extract suggestions
        const suggestions = [];
        const suggestionMatches = responseText.match(/[-•]\s*([^\n]+)/g);
        if (suggestionMatches) {
            suggestionMatches.slice(0, 5).forEach(s => {
                suggestions.push(s.replace(/^[-•]\s*/, '').trim());
            });
        }

        return {
            content: responseText,
            refinedProblem,
            suggestions,
        };
    } catch (error) {
        console.error('Gemini API error:', error);
        throw new Error('Failed to generate response');
    }
}

// Search problems across all databases
async function searchProblems(queryText) {
    try {
        // Simple keyword search for now (can be enhanced with vector search later)
        const keywords = queryText.toLowerCase().split(' ').filter(w => w.length > 3);

        if (keywords.length === 0) {
            return { problems: [], summary: 'No relevant problems found' };
        }

        const searchPattern = keywords.join(' | ');

        // Search community problems
        const communityResult = await query(
            `SELECT problem_id, title, description, category, tags, 'community' as source
       FROM problems_community
       WHERE to_tsvector('english', title || ' ' || description) @@ to_tsquery('english', $1)
       AND status = 'open'
       LIMIT 5`,
            [searchPattern]
        );

        // Search scraped problems
        const scrapedResult = await query(
            `SELECT problem_id, title, extracted_problem as description, category, tags, 'web_scraped' as source
       FROM problems_web_scraped
       WHERE to_tsvector('english', title || ' ' || extracted_problem) @@ to_tsquery('english', $1)
       AND is_active = true
       LIMIT 5`,
            [searchPattern]
        );

        // Search existing research problems
        const existingResult = await query(
            `SELECT problem_id, title, description, category, tags, 'research' as source
       FROM problems_existing
       WHERE to_tsvector('english', title || ' ' || description) @@ to_tsquery('english', $1)
       LIMIT 5`,
            [searchPattern]
        );

        const allProblems = [
            ...communityResult.rows,
            ...scrapedResult.rows,
            ...existingResult.rows,
        ];

        return {
            problems: allProblems.map(p => ({
                id: p.problem_id,
                title: p.title,
                description: p.description,
                category: p.category,
                tags: p.tags,
                source: p.source,
            })),
            summary: `Found ${allProblems.length} related problems across our databases`,
        };
    } catch (error) {
        console.error('Search problems error:', error);
        return { problems: [], summary: 'Search temporarily unavailable' };
    }
}

// Create a new chat session
async function createSession(userId, title) {
    const result = await query(
        `INSERT INTO chat_sessions (user_id, title) VALUES ($1, $2) RETURNING session_id`,
        [userId, title || 'New Conversation']
    );
    return result.rows[0].session_id;
}

// Get session history
async function getSessionHistory(sessionId) {
    const result = await query(
        `SELECT role, content FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC`,
        [sessionId]
    );
    return result.rows;
}

module.exports = {
    generateResponse,
    searchProblems,
    createSession,
    getSessionHistory,
};

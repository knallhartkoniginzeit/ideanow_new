const { GoogleGenerativeAI } = require('@google/generative-ai');
const { query } = require('../../db');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are an AI assistant for !deanow, a platform that helps users discover and refine niche problem statements. Your goal is to guide the user through a structured refinement process.

### Your Interaction Style:
1. **Be Conversational & Guided**: Do NOT dump a long analysis immediately. Start by understanding the core idea.
2. **Ask Clarifying Questions**: If the user's idea is vague, ask 1-2 specific questions to narrow it down before offering solutions.
3. **Structured Output**: Use clear headings, bullet points, and short paragraphs. Avoid walls of text.

### When analyzing a problem:
1. **Check for Similarity**: Compare the user's idea with the provided database problems.
2. **Relevance Score**: If a database problem is similar, YOU MUST assign a "Relevance Score" (0-100%).
3. **Clickable Links**: When referencing a database problem, ALWAYS format it as a link: [Problem Title](/problems/ProblemID).

### Response Structure (Iterative):
- **Phase 1 (Initial Idea)**: Acknowledge the idea, identify the domain, and ask clarifying questions to refine the scope.
- **Phase 2 (Refinement)**: Once you have enough info, propose a "Refined Problem Statement" and show "Related Problems" with scores.
- **Phase 3 (Deep Dive)**: Only after the user confirms the direction, provide innovation opportunities and technical suggestions.

**Format for Related Problems (MANDATORY):**
*   **[Problem Title](/problems/123)** - **Relevance Score: 85%**
    *   *Why*: Brief explanation of similarity.

**Format your responses in clean Markdown.**`;

// Generate AI response using Gemini
async function generateResponse(userMessage, conversationHistory, searchResults) {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

        // Build context from search results
        let contextFromSearch = '';
        if (searchResults.problems.length > 0) {
            contextFromSearch = `\n\n### Database Matches (Use these for similarity analysis):\n`;
            searchResults.problems.slice(0, 3).forEach((p, i) => {
                // Formatting links for the AI to use
                contextFromSearch += `${i + 1}. Title: "${p.title}" | ID: ${p.id} | Link: /problems/${p.id} | Desc: ${p.description.substring(0, 150)}...\n`;
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
                maxOutputTokens: 1000, // Reduced for more concise responses
                temperature: 0.7,
            },
        });

        // Send message with context
        const prompt = `${SYSTEM_PROMPT}\n${contextFromSearch}\n\nUser: ${userMessage}\n\nINSTRUCTION: improved guided response with clickable links [Title](/problems/ID) for related items.`;
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

        // FALLBACK: Provide intelligent response without Gemini
        return generateFallbackResponse(userMessage, searchResults);
    }
}

// Fallback response when Gemini API is unavailable
function generateFallbackResponse(userMessage, searchResults) {
    const keywords = userMessage.toLowerCase();
    let response = `## Problem Analysis\n\n`;
    response += `Thank you for sharing your problem idea! While our AI assistant is temporarily unavailable, I can still help you refine your problem statement.\n\n`;

    // Detect domain
    const domains = {
        'healthcare': 'Healthcare & Medical Technology',
        'health': 'Healthcare & Medical Technology',
        'medical': 'Healthcare & Medical Technology',
        'education': 'Education & E-Learning',
        'learning': 'Education & E-Learning',
        'finance': 'Finance & Fintech',
        'payment': 'Finance & Fintech',
        'ecommerce': 'E-commerce & Retail',
        'shopping': 'E-commerce & Retail',
        'ai': 'Artificial Intelligence',
        'machine learning': 'Machine Learning',
        'blockchain': 'Blockchain & Web3',
    };

    let detectedDomain = 'Technology';
    for (const [keyword, domain] of Object.entries(domains)) {
        if (keywords.includes(keyword)) {
            detectedDomain = domain;
            break;
        }
    }

    response += `### Detected Domain\n**${detectedDomain}**\n\n`;

    // Provide guidance
    response += `### Next Steps to Refine Your Problem\n\n`;
    response += `1. **Be Specific**: What exact pain point are you addressing?\n`;
    response += `2. **Define Your Users**: Who will benefit from solving this problem?\n`;
    response += `3. **Scope It Down**: Can you focus on one specific aspect first?\n`;
    response += `4. **Research**: Check if similar solutions exist and how yours is different\n\n`;

    // Show related problems if any
    if (searchResults.problems.length > 0) {
        response += `### Related Problems in Our Community\n\n`;
        response += `I found ${searchResults.problems.length} similar problems:\n\n`;
        searchResults.problems.slice(0, 3).forEach((p, i) => {
            response += `${i + 1}. **${p.title}** (${p.category})\n`;
        });
        response += `\n`;
    }

    response += `### Ready to Post?\n\n`;
    response += `Once you've refined your problem, you can [post it to our community](/problems/new) to get feedback and find solvers!\n\n`;
    response += `*Note: Our AI assistant will be back online soon for more detailed problem refinement.*`;

    const refinedProblem = `${detectedDomain} problem: ${userMessage.substring(0, 100)}`;

    return {
        content: response,
        refinedProblem,
        suggestions: [
            'Define the specific user pain point',
            'Research existing solutions',
            'Identify your unique value proposition',
            'Start with an MVP scope',
        ],
    };
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

        // Search community problems only (other tables will be added in Phase 3)
        const communityResult = await query(
            `SELECT problem_id, title, description, category, tags, 'community' as source
       FROM problems_community
       WHERE to_tsvector('english', title || ' ' || description) @@ to_tsquery('english', $1)
       AND status = 'open'
       LIMIT 10`,
            [searchPattern]
        );

        const allProblems = communityResult.rows;

        return {
            problems: allProblems.map(p => ({
                id: p.problem_id,
                title: p.title,
                description: p.description,
                category: p.category,
                tags: p.tags,
                source: p.source,
            })),
            summary: `Found ${allProblems.length} related problems in our community`,
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

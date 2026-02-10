const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../../db');
const { authenticate } = require('../middleware/auth');
const { generateResponse, searchProblems, createSession, getSessionHistory } = require('../../services/ai/chatService');

const router = express.Router();

// TEMP: Run migration manually
router.get('/fix-db', async (req, res) => {
    try {
        await query(`
            ALTER TABLE chat_sessions 
            ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
        `);
        res.json({ message: 'Database updated successfully! Please refresh.' });
    } catch (error) {
        console.error('Migration error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/chat/query - Process a chat message
router.post('/query', [
    body('message').trim().isLength({ min: 1 }).withMessage('Message is required'),
    body('sessionId').optional().isUUID(),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { message, sessionId } = req.body;

        // Get user from token if provided (optional)
        let userId = null;
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
            try {
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.userId;
            } catch (err) {
                // Token invalid, continue as guest
            }
        }

        // Get or create session (only if authenticated)
        let currentSessionId = sessionId;
        if (userId && !currentSessionId) {
            console.log('Creating new session for user:', userId);
            currentSessionId = await createSession(userId, message.substring(0, 100));
            console.log('Created session:', currentSessionId);
        }

        // Get conversation history (only if session exists)
        const history = currentSessionId ? await getSessionHistory(currentSessionId) : [];

        // Search relevant problems from all databases
        const searchResults = await searchProblems(message);

        // Generate AI response
        const response = await generateResponse(message, history, searchResults);

        // Save messages only if authenticated and has session
        if (userId && currentSessionId) {
            console.log('Saving messages for session:', currentSessionId);
            // Save user message
            await query(
                `INSERT INTO chat_messages (session_id, role, content) VALUES ($1, 'user', $2)`,
                [currentSessionId, message]
            );

            // Save assistant response
            await query(
                `INSERT INTO chat_messages (session_id, role, content, metadata) VALUES ($1, 'assistant', $2, $3)`,
                [currentSessionId, response.content, JSON.stringify({ searchResults: searchResults.summary })]
            );
            console.log('Messages saved successfully');
        }

        res.json({
            sessionId: currentSessionId,
            response: response.content,
            refinedProblem: response.refinedProblem,
            relatedProblems: searchResults.problems.slice(0, 5),
            suggestions: response.suggestions,
        });
    } catch (error) {
        console.error('Chat query error:', error);
        res.status(500).json({ error: 'Failed to process message' });
    }
});

// GET /api/chat/sessions - Get user's chat sessions
router.get('/sessions', authenticate, async (req, res) => {
    try {
        const result = await query(
            `SELECT session_id, title, created_at, updated_at, is_pinned
       FROM chat_sessions
       WHERE user_id = $1
       ORDER BY is_pinned DESC, updated_at DESC
       LIMIT 20`,
            [req.user.user_id]
        );

        res.json({
            sessions: result.rows.map(s => ({
                id: s.session_id,
                title: s.title,
                createdAt: s.created_at,
                updatedAt: s.updated_at,
                isPinned: s.is_pinned || false,
            })),
        });
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

// PUT /api/chat/sessions/:id/pin - Toggle pin status
router.put('/sessions/:id/pin', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { isPinned } = req.body;

        const result = await query(
            'UPDATE chat_sessions SET is_pinned = $1 WHERE session_id = $2 AND user_id = $3 RETURNING session_id, is_pinned',
            [isPinned, id, req.user.user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json({ message: 'Session updated', isPinned: result.rows[0].is_pinned });
    } catch (error) {
        console.error('Update session pin error:', error);
        res.status(500).json({ error: 'Failed to update session' });
    }
});

// GET /api/chat/sessions/:id - Get session messages
router.get('/sessions/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        // Verify session belongs to user
        const sessionResult = await query(
            'SELECT user_id, title, is_pinned FROM chat_sessions WHERE session_id = $1',
            [id]
        );

        if (sessionResult.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }

        if (sessionResult.rows[0].user_id !== req.user.user_id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const messagesResult = await query(
            `SELECT message_id, role, content, metadata, created_at
       FROM chat_messages
       WHERE session_id = $1
       ORDER BY created_at ASC`,
            [id]
        );

        res.json({
            session: {
                id,
                title: sessionResult.rows[0].title,
                isPinned: sessionResult.rows[0].is_pinned || false,
            },
            messages: messagesResult.rows.map(m => ({
                id: m.message_id,
                role: m.role,
                content: m.content,
                metadata: m.metadata,
                createdAt: m.created_at,
            })),
        });
    } catch (error) {
        console.error('Get session messages error:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// DELETE /api/chat/sessions/:id - Delete a session
router.delete('/sessions/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            'DELETE FROM chat_sessions WHERE session_id = $1 AND user_id = $2 RETURNING session_id',
            [id, req.user.user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json({ message: 'Session deleted' });
    } catch (error) {
        console.error('Delete session error:', error);
        res.status(500).json({ error: 'Failed to delete session' });
    }
});

module.exports = router;

const express = require('express');
const { query } = require('../../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Helper function to create a notification
async function createNotification(userId, type, title, message, link = null, relatedId = null) {
    await query(
        `INSERT INTO notifications (user_id, type, title, message, link, related_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, type, title, message, link, relatedId]
    );
}

// GET /api/notifications - Get user's notifications
router.get('/', authenticate, async (req, res) => {
    try {
        const result = await query(
            `SELECT * FROM notifications 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT 50`,
            [req.user.user_id]
        );

        res.json({
            notifications: result.rows.map(n => ({
                id: n.notification_id,
                type: n.type,
                title: n.title,
                message: n.message,
                link: n.link,
                relatedId: n.related_id,
                isRead: n.is_read,
                createdAt: n.created_at,
            })),
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// GET /api/notifications/unread-count - Get count of unread notifications
router.get('/unread-count', authenticate, async (req, res) => {
    try {
        const result = await query(
            `SELECT COUNT(*) FROM notifications 
             WHERE user_id = $1 AND is_read = FALSE`,
            [req.user.user_id]
        );

        res.json({ count: parseInt(result.rows[0].count) });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ error: 'Failed to fetch unread count' });
    }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        await query(
            `UPDATE notifications 
             SET is_read = TRUE 
             WHERE notification_id = $1 AND user_id = $2`,
            [id, req.user.user_id]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: 'Failed to mark as read' });
    }
});

// PUT /api/notifications/mark-all-read - Mark all notifications as read
router.put('/mark-all-read', authenticate, async (req, res) => {
    try {
        await query(
            `UPDATE notifications 
             SET is_read = TRUE 
             WHERE user_id = $1 AND is_read = FALSE`,
            [req.user.user_id]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
});

// DELETE /api/notifications/:id - Delete a notification
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        await query(
            `DELETE FROM notifications 
             WHERE notification_id = $1 AND user_id = $2`,
            [id, req.user.user_id]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

module.exports = { router, createNotification };

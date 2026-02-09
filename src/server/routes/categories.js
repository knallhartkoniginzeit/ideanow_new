const express = require('express');
const { query } = require('../../db');

const router = express.Router();

// GET /api/categories - Get all categories
router.get('/', async (req, res) => {
    try {
        const result = await query(
            `SELECT category_id, name, description, icon, color, parent_id
       FROM categories
       ORDER BY name ASC`
        );

        res.json({
            categories: result.rows.map(c => ({
                id: c.category_id,
                name: c.name,
                description: c.description,
                icon: c.icon,
                color: c.color,
                parentId: c.parent_id,
            })),
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// GET /api/categories/stats - Get category statistics
router.get('/stats', async (req, res) => {
    try {
        const result = await query(
            `SELECT 
        c.name,
        c.icon,
        c.color,
        COUNT(pc.problem_id) as problem_count,
        COUNT(pc.problem_id) FILTER (WHERE pc.status = 'open') as open_count
       FROM categories c
       LEFT JOIN problems_community pc ON c.name = pc.category
       GROUP BY c.category_id, c.name, c.icon, c.color
       ORDER BY problem_count DESC`
        );

        res.json({
            categories: result.rows.map(c => ({
                name: c.name,
                icon: c.icon,
                color: c.color,
                problemCount: parseInt(c.problem_count),
                openCount: parseInt(c.open_count),
            })),
        });
    } catch (error) {
        console.error('Get category stats error:', error);
        res.status(500).json({ error: 'Failed to fetch category stats' });
    }
});

module.exports = router;

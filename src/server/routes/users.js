const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../../db');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/:id - Get user profile
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            `SELECT user_id, name, avatar_url, role, skills, bio, rating, 
              total_ratings, completed_projects, created_at, is_verified
       FROM users WHERE user_id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        const isOwnProfile = req.user?.user_id === id;

        // Get problem stats
        const problemStats = await query(
            `SELECT 
        COUNT(*) FILTER (WHERE status = 'open') as open_problems,
        COUNT(*) FILTER (WHERE status = 'solved') as solved_problems,
        COUNT(*) as total_problems
       FROM problems_community WHERE user_id = $1`,
            [id]
        );

        // Get solution stats
        const solutionStats = await query(
            `SELECT 
        COUNT(*) FILTER (WHERE status = 'accepted') as accepted_solutions,
        COUNT(*) as total_solutions
       FROM solutions WHERE solver_id = $1`,
            [id]
        );

        res.json({
            id: user.user_id,
            name: user.name,
            avatarUrl: user.avatar_url,
            role: user.role,
            skills: user.skills,
            bio: user.bio,
            rating: parseFloat(user.rating),
            totalRatings: user.total_ratings,
            completedProjects: user.completed_projects,
            createdAt: user.created_at,
            isVerified: user.is_verified,
            isOwnProfile,
            stats: {
                openProblems: parseInt(problemStats.rows[0].open_problems),
                solvedProblems: parseInt(problemStats.rows[0].solved_problems),
                totalProblems: parseInt(problemStats.rows[0].total_problems),
                acceptedSolutions: parseInt(solutionStats.rows[0].accepted_solutions),
                totalSolutions: parseInt(solutionStats.rows[0].total_solutions),
            },
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// PUT /api/users/profile - Update own profile
router.put('/profile', authenticate, [
    body('name').optional().trim().isLength({ min: 2, max: 255 }),
    body('bio').optional().trim().isLength({ max: 1000 }),
    body('skills').optional().isArray(),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, bio, skills, avatarUrl, role } = req.body;

        const updateFields = [];
        const params = [];
        let paramIndex = 1;

        if (name) { updateFields.push(`name = $${paramIndex++}`); params.push(name); }
        if (bio !== undefined) { updateFields.push(`bio = $${paramIndex++}`); params.push(bio); }
        if (skills) { updateFields.push(`skills = $${paramIndex++}`); params.push(skills); }
        if (avatarUrl !== undefined) { updateFields.push(`avatar_url = $${paramIndex++}`); params.push(avatarUrl); }
        if (role && ['problem_poster', 'solver', 'both'].includes(role)) {
            updateFields.push(`role = $${paramIndex++}`);
            params.push(role);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        params.push(req.user.user_id);
        await query(
            `UPDATE users SET ${updateFields.join(', ')} WHERE user_id = $${paramIndex}`,
            params
        );

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// GET /api/users/:id/problems - Get user's problems
router.get('/:id/problems', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, page = 1, limit = 10 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let whereClause = 'WHERE user_id = $1';
        const params = [id];

        if (status) {
            whereClause += ` AND status = $2`;
            params.push(status);
        }

        const result = await query(
            `SELECT problem_id, title, category, tags, scale, budget, status, 
              views_count, applications_count, created_at
       FROM problems_community
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
            [...params, parseInt(limit), offset]
        );

        res.json({
            problems: result.rows.map(p => ({
                id: p.problem_id,
                title: p.title,
                category: p.category,
                tags: p.tags,
                scale: p.scale,
                budget: p.budget ? parseFloat(p.budget) : null,
                status: p.status,
                viewsCount: p.views_count,
                applicationsCount: p.applications_count,
                createdAt: p.created_at,
            })),
        });
    } catch (error) {
        console.error('Get user problems error:', error);
        res.status(500).json({ error: 'Failed to fetch problems' });
    }
});

// GET /api/users/dashboard/stats - Get dashboard stats for current user
router.get('/dashboard/stats', authenticate, async (req, res) => {
    try {
        // Problems posted
        const postedProblems = await query(
            `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'open') as open,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'solved') as solved
       FROM problems_community WHERE user_id = $1`,
            [req.user.user_id]
        );

        // Applications sent
        const applications = await query(
            `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'accepted') as accepted
       FROM applications WHERE solver_id = $1`,
            [req.user.user_id]
        );

        // Active projects (as solver)
        const activeProjects = await query(
            `SELECT COUNT(*) FROM problems_community 
       WHERE solver_id = $1 AND status = 'in_progress'`,
            [req.user.user_id]
        );

        // Recent activity
        const recentActivity = await query(
            `(SELECT 'problem_posted' as type, title as description, created_at
        FROM problems_community WHERE user_id = $1 ORDER BY created_at DESC LIMIT 3)
       UNION ALL
       (SELECT 'application_sent' as type, 
        (SELECT title FROM problems_community WHERE problem_id = a.problem_id) as description,
        a.created_at
        FROM applications a WHERE solver_id = $1 ORDER BY created_at DESC LIMIT 3)
       ORDER BY created_at DESC LIMIT 5`,
            [req.user.user_id]
        );

        res.json({
            postedProblems: {
                total: parseInt(postedProblems.rows[0].total),
                open: parseInt(postedProblems.rows[0].open),
                inProgress: parseInt(postedProblems.rows[0].in_progress),
                solved: parseInt(postedProblems.rows[0].solved),
            },
            applications: {
                total: parseInt(applications.rows[0].total),
                pending: parseInt(applications.rows[0].pending),
                accepted: parseInt(applications.rows[0].accepted),
            },
            activeProjects: parseInt(activeProjects.rows[0].count),
            recentActivity: recentActivity.rows.map(a => ({
                type: a.type,
                description: a.description,
                createdAt: a.created_at,
            })),
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

module.exports = router;

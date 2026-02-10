const express = require('express');
const { query } = require('../../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/applications/my-applications - Get current user's applications
router.get('/my-applications', authenticate, async (req, res) => {
    try {
        const result = await query(
            `SELECT 
                a.*,
                pc.problem_id, pc.title as problem_title, pc.description as problem_description,
                pc.category, pc.budget, pc.status as problem_status,
                u.name as poster_name, u.email as poster_email
            FROM applications a
            JOIN problems_community pc ON a.problem_id = pc.problem_id
            JOIN users u ON pc.user_id = u.user_id
            WHERE a.solver_id = $1
            ORDER BY a.created_at DESC`,
            [req.user.user_id]
        );

        res.json({
            applications: result.rows.map(app => ({
                id: app.application_id,
                problemId: app.problem_id,
                problemTitle: app.problem_title,
                problemDescription: app.problem_description,
                category: app.category,
                budget: app.budget ? parseFloat(app.budget) : null,
                problemStatus: app.problem_status,
                posterName: app.poster_name,
                posterEmail: app.poster_email,
                coverLetter: app.cover_letter,
                proposedApproach: app.proposed_approach,
                estimatedTime: app.estimated_time,
                proposedBudget: app.proposed_budget ? parseFloat(app.proposed_budget) : null,
                status: app.status,
                createdAt: app.created_at,
                updatedAt: app.updated_at,
            })),
        });
    } catch (error) {
        console.error('Get my applications error:', error);
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
});

// GET /api/applications/received - Get applications received on user's problems
router.get('/received', authenticate, async (req, res) => {
    try {
        const result = await query(
            `SELECT 
                a.*,
                pc.problem_id, pc.title as problem_title,
                u.name as solver_name, u.email as solver_email, u.avatar_url as solver_avatar,
                COALESCE(u.rating, 0.00) as solver_rating,
                COALESCE(u.completed_projects, 0) as solver_completed_projects
            FROM applications a
            JOIN problems_community pc ON a.problem_id = pc.problem_id
            JOIN users u ON a.solver_id = u.user_id
            WHERE pc.user_id = $1
            ORDER BY a.created_at DESC`,
            [req.user.user_id]
        );

        res.json({
            applications: result.rows.map(app => ({
                id: app.application_id,
                problemId: app.problem_id,
                problemTitle: app.problem_title,
                solver: {
                    name: app.solver_name,
                    email: app.solver_email,
                    avatarUrl: app.solver_avatar,
                    rating: parseFloat(app.solver_rating) || 0,
                    completedProjects: app.solver_completed_projects || 0,
                },
                coverLetter: app.cover_letter,
                proposedApproach: app.proposed_approach,
                estimatedTime: app.estimated_time,
                proposedBudget: app.proposed_budget ? parseFloat(app.proposed_budget) : null,
                status: app.status,
                createdAt: app.created_at,
                updatedAt: app.updated_at,
            })),
        });
    } catch (error) {
        console.error('Get received applications error:', error);
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
});

module.exports = router;

const express = require('express');
const { body, query: checkQuery, validationResult } = require('express-validator');
const { query } = require('../../db');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/problems/stats - Community statistics
router.get('/stats', async (req, res) => {
    try {
        const stats = await query(`
            SELECT 
                (SELECT COUNT(*) FROM problems_community WHERE status = 'open') as active_problems,
                (SELECT COUNT(DISTINCT user_id) FROM users WHERE role IN ('solver', 'both')) as active_solvers,
                (SELECT COUNT(*) FROM solutions) as total_solutions,
                (SELECT COALESCE(SUM(budget), 0) FROM problems_community WHERE status = 'open') as total_budget
        `);

        res.json(stats.rows[0]);
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// GET /api/problems - List community problems with filters
router.get('/', optionalAuth, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 12,
            category,
            status = 'open',
            scale,
            search,
            tags,
            minBudget,
            maxBudget,
            sortBy = 'created_at',
            sortOrder = 'desc',
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const params = [];
        let paramIndex = 1;

        // Build WHERE clause
        let whereClause = 'WHERE 1=1';

        if (status && status !== 'all') {
            whereClause += ` AND pc.status = $${paramIndex++}`;
            params.push(status);
        }

        if (category) {
            whereClause += ` AND pc.category = $${paramIndex++}`;
            params.push(category);
        }

        if (scale) {
            whereClause += ` AND pc.scale = $${paramIndex++}`;
            params.push(scale);
        }

        if (search) {
            whereClause += ` AND (pc.title ILIKE $${paramIndex} OR pc.description ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (tags) {
            const tagArray = tags.split(',');
            whereClause += ` AND pc.tags && $${paramIndex++}`;
            params.push(tagArray);
        }

        if (minBudget) {
            whereClause += ` AND pc.budget >= $${paramIndex++}`;
            params.push(parseFloat(minBudget));
        }

        if (maxBudget) {
            whereClause += ` AND pc.budget <= $${paramIndex++}`;
            params.push(parseFloat(maxBudget));
        }

        // Validate sort options
        const validSortFields = ['created_at', 'budget', 'views_count', 'applications_count'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
        const order = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

        // Count total
        const countResult = await query(
            `SELECT COUNT(*) FROM problems_community pc ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        // Fetch problems
        params.push(parseInt(limit), offset);
        const result = await query(
            `SELECT 
        pc.problem_id, pc.title, pc.description, pc.category, pc.tags, 
        pc.scale, pc.budget, pc.currency, pc.status, pc.required_skills,
        pc.deadline, pc.views_count, pc.applications_count, pc.created_at,
        u.user_id as poster_id, u.name as poster_name, u.avatar_url as poster_avatar, u.rating as poster_rating
       FROM problems_community pc
       JOIN users u ON pc.user_id = u.user_id
       ${whereClause}
       ORDER BY pc.${sortField} ${order}
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
            params
        );

        res.json({
            problems: result.rows.map(p => ({
                id: p.problem_id,
                title: p.title,
                description: p.description.substring(0, 200) + (p.description.length > 200 ? '...' : ''),
                category: p.category,
                tags: p.tags,
                scale: p.scale,
                budget: p.budget ? parseFloat(p.budget) : null,
                currency: p.currency,
                status: p.status,
                requiredSkills: p.required_skills,
                deadline: p.deadline,
                viewsCount: p.views_count,
                applicationsCount: p.applications_count,
                createdAt: p.created_at,
                poster: {
                    id: p.poster_id,
                    name: p.poster_name,
                    avatarUrl: p.poster_avatar,
                    rating: parseFloat(p.poster_rating),
                },
            })),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error('List problems error:', error);
        res.status(500).json({ error: 'Failed to fetch problems' });
    }
});

// GET /api/problems/:id - Get single problem
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;

        // Increment view count
        await query(
            'UPDATE problems_community SET views_count = views_count + 1 WHERE problem_id = $1',
            [id]
        );

        const result = await query(
            `SELECT 
        pc.*,
        u.user_id as poster_id, u.name as poster_name, u.email as poster_email,
        u.avatar_url as poster_avatar, 
        COALESCE(u.rating, 0.00) as poster_rating, 
        COALESCE(u.completed_projects, 0) as poster_projects,
        s.user_id as solver_id, s.name as solver_name, s.avatar_url as solver_avatar
       FROM problems_community pc
       JOIN users u ON pc.user_id = u.user_id
       LEFT JOIN users s ON pc.solver_id = s.user_id
       WHERE pc.problem_id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        const p = result.rows[0];

        // Get applications count
        const appsResult = await query(
            'SELECT COUNT(*) FROM applications WHERE problem_id = $1',
            [id]
        );

        // Check if current user has applied
        let hasApplied = false;
        if (req.user) {
            const appCheck = await query(
                'SELECT application_id FROM applications WHERE problem_id = $1 AND solver_id = $2',
                [id, req.user.user_id]
            );
            hasApplied = appCheck.rows.length > 0;
        }

        res.json({
            id: p.problem_id,
            title: p.title,
            description: p.description,
            category: p.category,
            tags: p.tags,
            scale: p.scale,
            budget: p.budget ? parseFloat(p.budget) : null,
            currency: p.currency,
            status: p.status,
            requiredSkills: p.required_skills,
            deadline: p.deadline,
            attachments: p.attachments,
            viewsCount: p.views_count,
            applicationsCount: parseInt(appsResult.rows[0].count),
            createdAt: p.created_at,
            updatedAt: p.updated_at,
            solvedAt: p.solved_at,
            poster: {
                id: p.poster_id,
                name: p.poster_name,
                avatarUrl: p.poster_avatar,
                rating: parseFloat(p.poster_rating) || 0,
                completedProjects: p.poster_projects || 0,
            },
            solver: p.solver_id ? {
                id: p.solver_id,
                name: p.solver_name,
                avatarUrl: p.solver_avatar,
            } : null,
            solutionDescription: p.solution_description,
            solutionRating: p.solution_rating,
            isOwner: req.user?.user_id === p.poster_id,
            hasApplied,
        });
    } catch (error) {
        console.error('Get problem error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: 'Failed to fetch problem', details: error.message });
    }
});

// POST /api/problems - Create new problem
router.post('/', authenticate, [
    body('title').trim().isLength({ min: 10, max: 500 }).withMessage('Title must be 10-500 characters'),
    body('description').trim().isLength({ min: 50 }).withMessage('Description must be at least 50 characters'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('scale').isIn(['small', 'medium', 'large', 'enterprise']).withMessage('Invalid scale'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            title,
            description,
            category,
            tags = [],
            scale,
            budget,
            currency = 'USD',
            requiredSkills = [],
            deadline,
            attachments = [],
        } = req.body;

        const result = await query(
            `INSERT INTO problems_community 
       (user_id, title, description, category, tags, scale, budget, currency, required_skills, deadline, attachments)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
            [req.user.user_id, title, description, category, tags, scale, budget || null, currency, requiredSkills, deadline || null, attachments]
        );

        const problem = result.rows[0];
        res.status(201).json({
            message: 'Problem created successfully',
            problem: {
                id: problem.problem_id,
                title: problem.title,
                status: problem.status,
                createdAt: problem.created_at,
            },
        });
    } catch (error) {
        console.error('Create problem error:', error);
        res.status(500).json({ error: 'Failed to create problem' });
    }
});

// PUT /api/problems/:id - Update problem
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        // Check ownership
        const checkResult = await query(
            'SELECT user_id, status FROM problems_community WHERE problem_id = $1',
            [id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        if (checkResult.rows[0].user_id !== req.user.user_id) {
            return res.status(403).json({ error: 'Not authorized to edit this problem' });
        }

        if (checkResult.rows[0].status !== 'open') {
            return res.status(400).json({ error: 'Cannot edit a problem that is not open' });
        }

        const {
            title,
            description,
            category,
            tags,
            scale,
            budget,
            requiredSkills,
            deadline,
        } = req.body;

        const updateFields = [];
        const params = [];
        let paramIndex = 1;

        if (title) { updateFields.push(`title = $${paramIndex++}`); params.push(title); }
        if (description) { updateFields.push(`description = $${paramIndex++}`); params.push(description); }
        if (category) { updateFields.push(`category = $${paramIndex++}`); params.push(category); }
        if (tags) { updateFields.push(`tags = $${paramIndex++}`); params.push(tags); }
        if (scale) { updateFields.push(`scale = $${paramIndex++}`); params.push(scale); }
        if (budget !== undefined) { updateFields.push(`budget = $${paramIndex++}`); params.push(budget); }
        if (requiredSkills) { updateFields.push(`required_skills = $${paramIndex++}`); params.push(requiredSkills); }
        if (deadline !== undefined) { updateFields.push(`deadline = $${paramIndex++}`); params.push(deadline); }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        params.push(id);
        await query(
            `UPDATE problems_community SET ${updateFields.join(', ')} WHERE problem_id = $${paramIndex}`,
            params
        );

        res.json({ message: 'Problem updated successfully' });
    } catch (error) {
        console.error('Update problem error:', error);
        res.status(500).json({ error: 'Failed to update problem' });
    }
});

// DELETE /api/problems/:id - Delete problem
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        const checkResult = await query(
            'SELECT user_id, status FROM problems_community WHERE problem_id = $1',
            [id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        if (checkResult.rows[0].user_id !== req.user.user_id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        if (['in_progress', 'under_review'].includes(checkResult.rows[0].status)) {
            return res.status(400).json({ error: 'Cannot delete a problem that is in progress' });
        }

        await query('DELETE FROM problems_community WHERE problem_id = $1', [id]);

        res.json({ message: 'Problem deleted successfully' });
    } catch (error) {
        console.error('Delete problem error:', error);
        res.status(500).json({ error: 'Failed to delete problem' });
    }
});

// POST /api/problems/:id/apply - Apply to solve a problem
router.post('/:id/apply', authenticate, [
    body('coverLetter').trim().isLength({ min: 50 }).withMessage('Cover letter must be at least 50 characters'),
    body('proposedApproach').trim().isLength({ min: 20 }).withMessage('Proposed approach is required'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { coverLetter, proposedApproach, estimatedTime, proposedBudget } = req.body;

        // Check if problem exists and is open
        const problemResult = await query(
            'SELECT user_id, status, title FROM problems_community WHERE problem_id = $1',
            [id]
        );

        if (problemResult.rows.length === 0) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        if (problemResult.rows[0].status !== 'open') {
            return res.status(400).json({ error: 'Problem is not open for applications' });
        }

        if (problemResult.rows[0].user_id === req.user.user_id) {
            return res.status(400).json({ error: 'Cannot apply to your own problem' });
        }

        // Check for existing application
        const existingApp = await query(
            'SELECT application_id FROM applications WHERE problem_id = $1 AND solver_id = $2',
            [id, req.user.user_id]
        );

        if (existingApp.rows.length > 0) {
            return res.status(409).json({ error: 'You have already applied to this problem' });
        }

        // Create application
        const appResult = await query(
            `INSERT INTO applications (problem_id, solver_id, cover_letter, proposed_approach, estimated_time, proposed_budget)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING application_id`,
            [id, req.user.user_id, coverLetter, proposedApproach, estimatedTime, proposedBudget]
        );

        // Update applications count
        await query(
            'UPDATE problems_community SET applications_count = applications_count + 1 WHERE problem_id = $1',
            [id]
        );

        // Create notification for problem owner
        const { createNotification } = require('./notifications');
        await createNotification(
            problemResult.rows[0].user_id,
            'application_received',
            'New Application Received',
            `${req.user.name} applied to solve your problem: "${problemResult.rows[0].title}"`,
            `/applications`,
            appResult.rows[0].application_id
        );

        res.status(201).json({ message: 'Application submitted successfully' });
    } catch (error) {
        console.error('Apply error:', error);
        res.status(500).json({ error: 'Failed to submit application' });
    }
});

// GET /api/problems/:id/applications - Get applications for a problem (owner only)
router.get('/:id/applications', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        // Check ownership
        const problemResult = await query(
            'SELECT user_id FROM problems_community WHERE problem_id = $1',
            [id]
        );

        if (problemResult.rows.length === 0) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        if (problemResult.rows[0].user_id !== req.user.user_id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const result = await query(
            `SELECT 
        a.*,
        u.user_id, u.name, u.avatar_url, u.rating, u.skills, u.completed_projects
       FROM applications a
       JOIN users u ON a.solver_id = u.user_id
       WHERE a.problem_id = $1
       ORDER BY a.created_at DESC`,
            [id]
        );

        res.json({
            applications: result.rows.map(a => ({
                id: a.application_id,
                coverLetter: a.cover_letter,
                proposedApproach: a.proposed_approach,
                estimatedTime: a.estimated_time,
                proposedBudget: a.proposed_budget ? parseFloat(a.proposed_budget) : null,
                status: a.status,
                createdAt: a.created_at,
                solver: {
                    id: a.user_id,
                    name: a.name,
                    avatarUrl: a.avatar_url,
                    rating: parseFloat(a.rating),
                    skills: a.skills,
                    completedProjects: a.completed_projects,
                },
            })),
        });
    } catch (error) {
        console.error('Get applications error:', error);
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
});

// POST /api/problems/:id/accept/:applicationId - Accept an application
router.post('/:id/accept/:applicationId', authenticate, async (req, res) => {
    try {
        const { id, applicationId } = req.params;

        // Check ownership
        const problemResult = await query(
            'SELECT user_id, status, title FROM problems_community WHERE problem_id = $1',
            [id]
        );

        if (problemResult.rows.length === 0) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        if (problemResult.rows[0].user_id !== req.user.user_id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        if (problemResult.rows[0].status !== 'open') {
            return res.status(400).json({ error: 'Problem is not open' });
        }

        // Get application and all other applications
        const appResult = await query(
            'SELECT solver_id FROM applications WHERE application_id = $1 AND problem_id = $2',
            [applicationId, id]
        );

        if (appResult.rows.length === 0) {
            return res.status(404).json({ error: 'Application not found' });
        }

        const solverId = appResult.rows[0].solver_id;

        // Get all other applications to notify rejected applicants
        const otherAppsResult = await query(
            'SELECT application_id, solver_id FROM applications WHERE problem_id = $1 AND application_id != $2',
            [id, applicationId]
        );

        // Update application status
        await query(
            'UPDATE applications SET status = $1 WHERE application_id = $2',
            ['accepted', applicationId]
        );

        // Reject other applications
        await query(
            `UPDATE applications SET status = 'rejected' WHERE problem_id = $1 AND application_id != $2`,
            [id, applicationId]
        );

        // Update problem
        await query(
            `UPDATE problems_community SET status = 'in_progress', solver_id = $1 WHERE problem_id = $2`,
            [solverId, id]
        );

        // Create notifications
        const { createNotification } = require('./notifications');

        // Notify accepted applicant
        await createNotification(
            solverId,
            'application_accepted',
            'Application Accepted! 🎉',
            `Your application for "${problemResult.rows[0].title}" has been accepted!`,
            `/problems/${id}`,
            applicationId
        );

        // Notify rejected applicants
        for (const app of otherAppsResult.rows) {
            await createNotification(
                app.solver_id,
                'application_rejected',
                'Application Not Selected',
                `Your application for "${problemResult.rows[0].title}" was not selected.`,
                `/applications`,
                app.application_id
            );
        }

        res.json({ message: 'Application accepted successfully' });
    } catch (error) {
        console.error('Accept application error:', error);
        res.status(500).json({ error: 'Failed to accept application' });
    }
});

// GET /api/problems/trending - Get trending problems
router.get('/trending/list', async (req, res) => {
    try {
        const result = await query(
            `SELECT 
        pc.problem_id, pc.title, pc.category, pc.tags, pc.scale, pc.budget,
        pc.views_count, pc.applications_count, pc.created_at,
        u.name as poster_name, u.avatar_url as poster_avatar
       FROM problems_community pc
       JOIN users u ON pc.user_id = u.user_id
       WHERE pc.status = 'open' 
         AND pc.created_at > NOW() - INTERVAL '7 days'
       ORDER BY (pc.views_count + pc.applications_count * 5) DESC
       LIMIT 10`
        );

        res.json({
            trending: result.rows.map(p => ({
                id: p.problem_id,
                title: p.title,
                category: p.category,
                tags: p.tags,
                scale: p.scale,
                budget: p.budget ? parseFloat(p.budget) : null,
                viewsCount: p.views_count,
                applicationsCount: p.applications_count,
                createdAt: p.created_at,
                poster: {
                    name: p.poster_name,
                    avatarUrl: p.poster_avatar,
                },
            })),
        });
    } catch (error) {
        console.error('Trending problems error:', error);
        res.status(500).json({ error: 'Failed to fetch trending problems' });
    }
});

module.exports = router;

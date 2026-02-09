const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/solutions - Submit a solution
router.post('/', authenticate, [
    body('problemId').isUUID().withMessage('Valid problem ID required'),
    body('description').trim().isLength({ min: 100 }).withMessage('Description must be at least 100 characters'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { problemId, description, approach, codeRepoLink, demoLink, attachments = [] } = req.body;

        // Check if problem exists and user is the assigned solver
        const problemResult = await query(
            'SELECT user_id, solver_id, status FROM problems_community WHERE problem_id = $1',
            [problemId]
        );

        if (problemResult.rows.length === 0) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        const problem = problemResult.rows[0];

        if (problem.solver_id !== req.user.user_id) {
            return res.status(403).json({ error: 'You are not the assigned solver for this problem' });
        }

        if (problem.status !== 'in_progress') {
            return res.status(400).json({ error: 'Problem is not in progress' });
        }

        // Check for existing solution
        const existingSolution = await query(
            'SELECT solution_id FROM solutions WHERE problem_id = $1 AND solver_id = $2',
            [problemId, req.user.user_id]
        );

        if (existingSolution.rows.length > 0) {
            // Update existing solution
            await query(
                `UPDATE solutions SET 
          description = $1, approach = $2, code_repo_link = $3, 
          demo_link = $4, attachments = $5, status = 'pending', submitted_at = NOW()
         WHERE problem_id = $6 AND solver_id = $7`,
                [description, approach, codeRepoLink, demoLink, attachments, problemId, req.user.user_id]
            );

            res.json({ message: 'Solution updated successfully' });
        } else {
            // Create new solution
            await query(
                `INSERT INTO solutions (problem_id, solver_id, description, approach, code_repo_link, demo_link, attachments)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [problemId, req.user.user_id, description, approach, codeRepoLink, demoLink, attachments]
            );

            // Update problem status
            await query(
                `UPDATE problems_community SET status = 'under_review' WHERE problem_id = $1`,
                [problemId]
            );

            res.status(201).json({ message: 'Solution submitted successfully' });
        }
    } catch (error) {
        console.error('Submit solution error:', error);
        res.status(500).json({ error: 'Failed to submit solution' });
    }
});

// GET /api/solutions/:problemId - Get solution for a problem
router.get('/:problemId', authenticate, async (req, res) => {
    try {
        const { problemId } = req.params;

        // Check if user is problem owner or solver
        const problemResult = await query(
            'SELECT user_id, solver_id FROM problems_community WHERE problem_id = $1',
            [problemId]
        );

        if (problemResult.rows.length === 0) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        const problem = problemResult.rows[0];
        const isOwner = problem.user_id === req.user.user_id;
        const isSolver = problem.solver_id === req.user.user_id;

        if (!isOwner && !isSolver) {
            return res.status(403).json({ error: 'Not authorized to view this solution' });
        }

        const result = await query(
            `SELECT s.*, u.name as solver_name, u.avatar_url as solver_avatar, u.rating as solver_rating
       FROM solutions s
       JOIN users u ON s.solver_id = u.user_id
       WHERE s.problem_id = $1`,
            [problemId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No solution submitted yet' });
        }

        const s = result.rows[0];
        res.json({
            id: s.solution_id,
            description: s.description,
            approach: s.approach,
            codeRepoLink: s.code_repo_link,
            demoLink: s.demo_link,
            attachments: s.attachments,
            status: s.status,
            feedback: s.feedback,
            rating: s.rating,
            submittedAt: s.submitted_at,
            reviewedAt: s.reviewed_at,
            solver: {
                id: s.solver_id,
                name: s.solver_name,
                avatarUrl: s.solver_avatar,
                rating: parseFloat(s.solver_rating),
            },
        });
    } catch (error) {
        console.error('Get solution error:', error);
        res.status(500).json({ error: 'Failed to fetch solution' });
    }
});

// POST /api/solutions/:solutionId/review - Review a solution (problem owner)
router.post('/:solutionId/review', authenticate, [
    body('status').isIn(['accepted', 'rejected', 'revision_requested']).withMessage('Invalid status'),
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { solutionId } = req.params;
        const { status, feedback, rating } = req.body;

        // Get solution and verify ownership
        const solutionResult = await query(
            `SELECT s.*, pc.user_id as problem_owner_id, pc.budget
       FROM solutions s
       JOIN problems_community pc ON s.problem_id = pc.problem_id
       WHERE s.solution_id = $1`,
            [solutionId]
        );

        if (solutionResult.rows.length === 0) {
            return res.status(404).json({ error: 'Solution not found' });
        }

        const solution = solutionResult.rows[0];

        if (solution.problem_owner_id !== req.user.user_id) {
            return res.status(403).json({ error: 'Not authorized to review this solution' });
        }

        // Update solution
        await query(
            `UPDATE solutions SET status = $1, feedback = $2, rating = $3, reviewed_at = NOW()
       WHERE solution_id = $4`,
            [status, feedback, rating, solutionId]
        );

        // Update problem status based on review
        let problemStatus;
        if (status === 'accepted') {
            problemStatus = 'solved';

            // Update solver stats
            await query(
                `UPDATE users SET completed_projects = completed_projects + 1 WHERE user_id = $1`,
                [solution.solver_id]
            );

            // Update solver rating
            if (rating) {
                await query(
                    `UPDATE users SET 
            rating = (rating * total_ratings + $1) / (total_ratings + 1),
            total_ratings = total_ratings + 1
           WHERE user_id = $2`,
                    [rating, solution.solver_id]
                );
            }
        } else if (status === 'revision_requested') {
            problemStatus = 'in_progress';
        } else {
            problemStatus = 'open';
        }

        await query(
            `UPDATE problems_community SET 
        status = $1, 
        solution_description = CASE WHEN $1 = 'solved' THEN $2 ELSE solution_description END,
        solution_rating = CASE WHEN $1 = 'solved' THEN $3 ELSE solution_rating END,
        solved_at = CASE WHEN $1 = 'solved' THEN NOW() ELSE solved_at END
       WHERE problem_id = $4`,
            [problemStatus, solution.description, rating, solution.problem_id]
        );

        res.json({ message: `Solution ${status}` });
    } catch (error) {
        console.error('Review solution error:', error);
        res.status(500).json({ error: 'Failed to review solution' });
    }
});

// GET /api/solutions/my/submitted - Get user's submitted solutions
router.get('/my/submitted', authenticate, async (req, res) => {
    try {
        const result = await query(
            `SELECT s.*, pc.title as problem_title, pc.category, pc.budget
       FROM solutions s
       JOIN problems_community pc ON s.problem_id = pc.problem_id
       WHERE s.solver_id = $1
       ORDER BY s.submitted_at DESC`,
            [req.user.user_id]
        );

        res.json({
            solutions: result.rows.map(s => ({
                id: s.solution_id,
                problemId: s.problem_id,
                problemTitle: s.problem_title,
                category: s.category,
                budget: s.budget ? parseFloat(s.budget) : null,
                status: s.status,
                rating: s.rating,
                submittedAt: s.submitted_at,
                reviewedAt: s.reviewed_at,
            })),
        });
    } catch (error) {
        console.error('Get my solutions error:', error);
        res.status(500).json({ error: 'Failed to fetch solutions' });
    }
});

module.exports = router;
